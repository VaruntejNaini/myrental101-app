import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import axios from "axios";
import { verifyToken, requireAdmin } from "../middleware/auth.js";
import { adminLimiter } from "../middleware/adminLimiter.js";
import { resolveDispute } from "../controllers/adminController.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";
import Auction from "../models/Auction.js";
import Notification from "../models/Notification.js";
import Message from "../models/Message.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { awardReputation } from "../services/reputationService.js";
import { canReadChat, canWriteChat, isChatParticipant, getChatReceiverId } from "../utils/chatPolicy.js";
import Bookmark from "../models/Bookmark.js";
import Bid from "../models/Bid.js";
import { createAuction } from "../services/auctionService.js";

import { upload } from "../middleware/upload.js";
import { uploadToCloudinary, cloudinary } from "../utils/cloudinary.js";
import { sendMail } from "../utils/mailer.js";
const router = express.Router();

const isOwner = (transaction, userId) => transaction.owner?.toString() === userId;
const isBorrower = (transaction, userId) => transaction.borrower?.toString() === userId;
const isParticipant = (transaction, userId) => isOwner(transaction, userId) || isBorrower(transaction, userId);

const getImageUrl = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.url || "";
};

const getImagePublicId = (image) => {
  if (!image || typeof image === "string") return null;
  return image.publicId || image.public_id || null;
};

// --- STATE MACHINE VALIDATION DEFINITIONS ---
const VALID_TRANSITIONS = {
  PENDING_NEGOTIATION: ["AWAITING_PAYMENT", "PENDING_NEGOTIATION"],
  AWAITING_PAYMENT: ["RESERVED", "PENDING_NEGOTIATION"],
  RESERVED: ["IN_POSSESSION"],
  IN_POSSESSION: ["RETURN_INITIATED"],
  RETURN_INITIATED: ["DAMAGE_REVIEW", "SETTLED"],
  DAMAGE_REVIEW: ["REFUND_PROCESSING", "DISPUTED"],
  REFUND_PROCESSING: ["SETTLED"],
  DISPUTED: ["SETTLED"],
};

// Check Overlapping Availability Conflicting Reservations
async function checkOverlap(productId, start, end, session = null) {
  const overlapping = await Transaction.findOne({
    product: productId,
    status: { $in: ["RESERVED", "IN_POSSESSION", "RETURN_INITIATED", "DAMAGE_REVIEW", "REFUND_PROCESSING"] },
    $or: [
      { startDate: { $lte: new Date(end) }, endDate: { $gte: new Date(start) } }
    ]
  }).session(session);
  return !overlapping;
}

// Helper to push automated notifications
async function createNotification(userId, type, title, message, senderId = null, link = "", transactionId = null, session = null) {
  try {
    // Map all notification types to valid schema enum values
    let newType;
    
    // Preserve exact types that are already valid enum values
    if (["OWNER_WANTS_TO_NEGOTIATE", "REQUEST_CANCELLED", "OFFER_RETRACTED", "OTP_HANDOFF", "OTP_RETURN"].includes(type)) {
      newType = type;
    } 
    // Map negotiation-related types to NEGOTIATION
    else if (["NEW_NEGOTIATION_OFFER", "OFFER_ACCEPTED", "OFFER_REJECTED", "Counter Offer Made"].includes(type)) {
      newType = "NEGOTIATION";
    }
    // Map order-related types to ORDER
    else if (["RETURN_INITIATED", "DISPUTE_RAISED", "SETTLEMENT_COMPLETED"].includes(type)) {
      newType = "ORDER";
    }
    // Map other known types
    else if (["OTP_GENERATED"].includes(type)) {
      newType = "SYSTEM";
    }
    // Default fallback
    else {
      newType = "SYSTEM";
    }
    
    const notif = new Notification({
      recipient: userId,
      sender: senderId,
      message: `${title}: ${message}`,
      type: newType,
      link: link,
      transactionId: transactionId
    });
    await notif.save({ session });
  } catch (err) {
    console.error("Notification creation failed:", err);
  }
}

// ==========================================
// 1. PRODUCTS CATALOUGE LISTINGS
// ==========================================

// Escape regex special characters utility
const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

const resolveProductStatuses = async (productsArray, currentUserId) => {
  if (!productsArray || productsArray.length === 0) return [];

  const productIds = productsArray.map(p => p._id);
  
  const allMatchedTransactions = await Transaction.find({
    product: { $in: productIds },
    $or: [
      ...(currentUserId ? [{ borrower: currentUserId }, { owner: currentUserId }] : []),
      { status: { $in: ["RESERVED", "IN_POSSESSION", "RETURN_INITIATED", "DAMAGE_REVIEW", "REFUND_PROCESSING", "DISPUTED"] } }
    ]
  }).sort({ updatedAt: -1 });

  const userTxMap = {};
  const globalActiveTxMap = {};
  const pendingCountMap = {};

  allMatchedTransactions.forEach(tx => {
    const pId = tx.product.toString();
    
    if (currentUserId && (tx.borrower.toString() === currentUserId || tx.owner.toString() === currentUserId)) {
      if (!userTxMap[pId]) {
        userTxMap[pId] = tx;
      }
    }
    
    if (["RESERVED", "IN_POSSESSION", "RETURN_INITIATED", "DAMAGE_REVIEW", "REFUND_PROCESSING", "DISPUTED"].includes(tx.status)) {
      if (!globalActiveTxMap[pId]) {
        globalActiveTxMap[pId] = tx;
      }
    }

    if (tx.status === "PENDING_NEGOTIATION") {
      pendingCountMap[pId] = (pendingCountMap[pId] || 0) + 1;
    }
  });

  return productsArray.map(p => {
    const plain = p.toObject();
    const userTx = userTxMap[plain._id.toString()];
    const globalTx = globalActiveTxMap[plain._id.toString()];
    
    plain.currentUserTransactionStatus = userTx ? userTx.status : null;
    plain.transactionUpdatedAt = userTx ? userTx.updatedAt : null;
    plain.isRentedOrReserved = globalTx ? true : false;
    plain.activeNegotiationsCount = pendingCountMap[plain._id.toString()] || 0;
    
    return plain;
  });
};

const ALLOWED_CATEGORIES = ["Electronics", "Vehicles", "Tools", "Outdoor", "Music"];
const ALLOWED_SORTS = ["price_asc", "price_desc", "newest", "distance_asc"];

// Get All Products (Filtered by Type / Proximity)
router.get("/products", async (req, res) => {
  try {
    const { 
      productType, 
      category, 
      minPrice, 
      maxPrice, 
      search, 
      latitude, 
      longitude, 
      maxDistance,
      sort,
      page,
      limit,
      paginated
    } = req.query;

    let query = { status: { $ne: "INACTIVE" } };

    // 1. Filter by productType
    if (productType) {
      query.productType = productType;
    }

    // 2. Validate & Filter by category
    if (category && category !== "All") {
      if (ALLOWED_CATEGORIES.includes(category)) {
        query.category = category;
      }
    }

    // 3. Validate & Filter by Price Range
    if (minPrice || maxPrice) {
      let min = minPrice ? Number(minPrice) : 0;
      let max = maxPrice ? Number(maxPrice) : Infinity;

      if (isNaN(min) || min < 0) min = 0;
      if (isNaN(max) || max < 0) max = Infinity;

      if (min > max) {
        const temp = min;
        min = max;
        max = temp;
      }

      query.rentalPrice = { $gte: min };
      if (max !== Infinity) {
        query.rentalPrice.$lte = max;
      }
    }

    // 4. Escape & Filter by Search keyword
    if (search) {
      const trimmedSearch = search.trim();
      if (trimmedSearch) {
        const escapedSearch = escapeRegex(trimmedSearch);
        query.$or = [
          { title: { $regex: escapedSearch, $options: "i" } },
          { description: { $regex: escapedSearch, $options: "i" } }
        ];
      }
    }

    // 5. Validate & Filter by Distance (Geospatial)
    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    const distNum = Number(maxDistance);

    const hasLocation = !isNaN(latNum) && !isNaN(lngNum) && !isNaN(distNum);

    if (hasLocation) {
      if (sort === "distance_asc") {
        query.location = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lngNum, latNum]
            },
            $maxDistance: distNum * 1000
          }
        };
      } else {
        const radiusInRadians = distNum / 6378.1;
        query.location = {
          $geoWithin: {
            $centerSphere: [[lngNum, latNum], radiusInRadians]
          }
        };
      }
    }

    // 6. Decode token optionally to exclude current user's own products
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let currentUserId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.id) {
          query.owner = { $ne: decoded.id };
          currentUserId = decoded.id;
        }
      } catch (err) {
        // Ignore token decode errors
      }
    }

    // 7. Sort Options
    let sortOption = { createdAt: -1 };
    let validatedSort = sort;
    if (sort && !ALLOWED_SORTS.includes(sort)) {
      validatedSort = "newest";
    }

    if (validatedSort === "price_asc") {
      sortOption = { rentalPrice: 1 };
    } else if (validatedSort === "price_desc") {
      sortOption = { rentalPrice: -1 };
    } else if (validatedSort === "newest") {
      sortOption = { createdAt: -1 };
    } else if (validatedSort === "distance_asc" && hasLocation) {
      sortOption = null;
    }

    // 8. Pagination & Response Formatting
    if (paginated === "true") {
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 12;
      const total = await Product.countDocuments(query);
      
      const totalPages = Math.ceil(total / limitNum) || 1;
      const validatedPage = Math.min(Math.max(1, pageNum), totalPages);
      const skip = (validatedPage - 1) * limitNum;

      let mongooseQuery = Product.find(query);
      if (sortOption) {
        mongooseQuery = mongooseQuery.sort(sortOption);
      }

      const products = await mongooseQuery
        .skip(skip)
        .limit(limitNum)
        .populate("owner", "name email");

      const resolvedProducts = await resolveProductStatuses(products, currentUserId);

      res.json({
        products: resolvedProducts,
        totalPages,
        currentPage: validatedPage,
        totalCount: total
      });
    } else {
      let mongooseQuery = Product.find(query);
      if (sortOption) {
        mongooseQuery = mongooseQuery.sort(sortOption);
      }
      const products = await mongooseQuery.populate("owner", "name email");
      const resolvedProducts = await resolveProductStatuses(products, currentUserId);
      res.json(resolvedProducts);
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get User's Own Listed Products
router.get("/products/me", verifyToken, async (req, res) => {
  try {
    const products = await Product.find({ owner: req.userId })
      .sort({ createdAt: -1 })
      .populate("owner", "name email");
    const resolvedProducts = await resolveProductStatuses(products, req.userId);
    res.json(resolvedProducts);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Toggle Status between ACTIVE and INACTIVE
router.put("/products/:id/toggle-status", verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "Invalid product ID format." });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product listing not found." });
    }

    if (product.owner.toString() !== req.userId) {
      return res.status(403).json({ msg: "Unauthorized: You do not own this listing." });
    }

    product.status = product.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get Product details
router.get("/products/:id", async (req, res) => {
  try {
    // Validate that req.params.id is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ msg: "Product not found" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    // Try to extract requesterId
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let requesterId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        requesterId = decoded.id;
      } catch (err) {
        // Token is invalid/expired
      }
    }

    const isOwner = requesterId && product.owner.toString() === requesterId;

    // Enforce ownership checks for INACTIVE listings
    if (product.status === "INACTIVE") {
      if (!isOwner) {
        return res.status(403).json({ msg: "Access denied: This listing has been deactivated by the owner." });
      }
    }

    // NOTE: view tracking moved to a dedicated endpoint POST /products/:id/view
    // to make GET /products/:id strictly read-only and avoid accidental
    // increments from re-renders, modal fetches or polling. See POST /products/:id/view below.

    // Populate owner info before returning response
    const populatedProduct = await Product.findById(product._id).populate("owner", "name email");

    // Attach current active auction context if applicable
    let auction = null;
    if (populatedProduct.status === "AUCTION_ACTIVE") {
      auction = await Auction.findOne({ product: populatedProduct._id, status: "ACTIVE" });
    }
    res.json({ product: populatedProduct, auction });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Add Product Listing
router.post("/products", verifyToken, upload.array("productImages", 5), async (req, res) => {
  // 1. Environment Pre-Validation Safeguard
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "ROOT") {
    return res.status(400).json({ msg: "Backend storage configuration error: Invalid or unconfigured Cloudinary Cloud Name." });
  }

  const uploadedAssets = [];
  console.log('>>> EXPRESS: Received POST /api/rent/products. headers:', {
    'content-type': req.headers['content-type'],
    authorization: !!req.headers['authorization']
  });
  console.log('>>> EXPRESS: multer parsed files count:', (req.files || []).length, 'body keys:', Object.keys(req.body || {}));
  try {
    if (!req.body) {
      throw new Error("req.body is undefined. Multipart parsing might have failed.");
    }
    const { title, description, category, rentalPrice, securityDeposit, city, area, productType, latitude, longitude } = req.body;
    
    // Process uploaded files if any
    if (req.files && req.files.length > 0) {
      const folder = productType === "RENT" ? "rentit/rent" : "rentit/secondhand";
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, folder);
        uploadedAssets.push({ url: result.secure_url, publicId: result.public_id });
      }
    }

    // Explicitly parse and normalize stringified values from multipart form-data
    const sanitizedRentalPrice = rentalPrice && rentalPrice.trim() !== "" ? Number(rentalPrice) : 0;
    const sanitizedSecurityDeposit = securityDeposit && securityDeposit.trim() !== "" ? Number(securityDeposit) : 0;

    const productData = {
      title,
      description,
      category,
      images: uploadedAssets,
      rentalPrice: sanitizedRentalPrice,
      securityDeposit: sanitizedSecurityDeposit,
      city,
      area,
      productType,
      owner: req.userId,
    };

    if (
      latitude !== undefined && 
      longitude !== undefined && 
      latitude !== null && 
      longitude !== null && 
      String(latitude).trim() !== "" && 
      String(longitude).trim() !== ""
    ) {
      productData.location = {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)]
      };
    }

    const product = await Product.create(productData);

    // Award +5 Reputation points to the owner
    await awardReputation(req.userId, 5, "PRODUCT_CREATED");
    
    res.status(201).json(product);
  } catch (err) {
    console.error("CRITICAL ERROR IN POST /products:", err);
    // Rollback uploaded Cloudinary assets on failure to prevent orphan storage leaks
    for (const asset of uploadedAssets) {
      const publicId = getImagePublicId(asset);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch(rollbackErr => {
          console.error(`Rollback error destroying asset ${publicId}:`, rollbackErr);
        });
      }
    }
    res.status(500).json({ msg: err.message });
  }
});

// Delete Product Listing (Shared for Rent and Second-Hand)
router.delete("/products/:id", verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "Invalid product ID format." });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product listing not found." });
    }

    // Validate ownership
    if (product.owner.toString() !== req.userId) {
      return res.status(403).json({ msg: "Unauthorized: You do not own this listing." });
    }

    // Find active transactions for this product
    const activeTransactions = await Transaction.find({
      product: req.params.id,
      status: {
        $in: [
          "PENDING_NEGOTIATION",
          "AWAITING_PAYMENT",
          "RESERVED",
          "NEGOTIATING",
          "ACCEPTED"
        ]
      }
    });

    // Notify affected borrowers
    const ownerUser = await User.findById(req.userId);
    const ownerName = ownerUser?.name || "The owner";
    for (const transaction of activeTransactions) {
      // Notification deduplication check
      const existingNotif = await Notification.findOne({
        recipient: transaction.borrower,
        transactionId: transaction._id,
        type: "OFFER_RETRACTED"
      });

      if (!existingNotif) {
        await createNotification(
          transaction.borrower,
          "OFFER_RETRACTED",
          "Offer Retracted",
          `${ownerName} has withdrawn the product "${product.title}".\n\nThe product is no longer available for rent, sale, negotiation, checkout, reservation, or any other service.`,
          req.userId,
          "",
          transaction._id
        );
      }
    }

    // Mark active transactions as retracted instead of deleting them
    await Transaction.updateMany(
      {
        product: req.params.id,
        status: {
          $in: [
            "PENDING_NEGOTIATION",
            "AWAITING_PAYMENT",
            "RESERVED",
            "NEGOTIATING",
            "ACCEPTED"
          ]
        }
      },
      {
        status: "RETRACTED",
        retractedAt: new Date()
      }
    );

    // Cleanup Cloudinary assets
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        const publicId = getImagePublicId(img);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId).catch(err => {
            console.error(`Failed to delete Cloudinary asset ${publicId}:`, err);
          });
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    // Deduct reputation if owner retracted while negotiations were active
    if (activeTransactions.length > 0) {
      await awardReputation(req.userId, -5, "LISTING_RETRACTED");
    }

    res.json({ msg: "Product listing deleted cleanly and active negotiations retracted." });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ==========================================
// 1B. EDIT PRODUCT LISTING (PATCH)
// ==========================================

router.patch("/products/:id", verifyToken, upload.array("productImages", 5), async (req, res) => {
  const uploadedAssets = [];
  try {
    // 1. Validate Product ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "Invalid product ID format." });
    }

    // 2. Fetch existing Product
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product listing not found." });
    }

    // 3. Verify ownership
    if (product.owner.toString() !== req.userId) {
      return res.status(403).json({ msg: "Unauthorized: You do not own this listing." });
    }

    // 4. Extract editable fields
    const { 
      title, 
      description, 
      category, 
      rentalPrice, 
      securityDeposit, 
      city, 
      area, 
      latitude, 
      longitude,
      retainedExistingImages
    } = req.body;

    // 5. Parse and validate retained images
    let validatedRetainedImages = [];
    try {
      const retainedParsed = retainedExistingImages ? JSON.parse(retainedExistingImages) : [];
      const currentPublicIds = (product.images || []).map(img => img.publicId);
      
      // Authorize each retained image against product.images
      for (const retainedImg of retainedParsed) {
        if (!currentPublicIds.includes(retainedImg.publicId)) {
          return res.status(400).json({ msg: "Authorization failed: one or more images do not belong to this listing." });
        }
      }
      validatedRetainedImages = retainedParsed;
    } catch (err) {
      return res.status(400).json({ msg: "Invalid retained images format." });
    }

    // 6. Validate editable fields using existing validators
    if (title && title.trim()) {
      if (title.trim().length < 3 || title.trim().length > 80) {
        return res.status(400).json({ msg: "Title must be 3-80 characters." });
      }
    }

    if (description && description.trim()) {
      if (description.trim().length < 20 || description.trim().length > 2000) {
        return res.status(400).json({ msg: "Description must be 20-2000 characters." });
      }
    }

    if (rentalPrice !== undefined && rentalPrice !== null) {
      if (Number(rentalPrice) < 1) {
        return res.status(400).json({ msg: "Price must be greater than ₹0." });
      }
    }

    if (product.productType === "RENT") {
      if (securityDeposit !== undefined && securityDeposit !== null) {
        if (Number(securityDeposit) < 0) {
          return res.status(400).json({ msg: "Security deposit cannot be negative." });
        }
      }
    }

    // 7. Upload new files to Cloudinary
    if (req.files && req.files.length > 0) {
      const folder = product.productType === "RENT" ? "rentit/rent" : "rentit/secondhand";
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer, folder);
          uploadedAssets.push({ url: result.secure_url, publicId: result.public_id });
        } catch (uploadErr) {
          // Rollback on first failed upload
          for (const asset of uploadedAssets) {
            const publicId = getImagePublicId(asset);
            if (publicId) {
              await cloudinary.uploader.destroy(publicId).catch(rollbackErr => {
                console.error(`Rollback error destroying asset ${publicId}:`, rollbackErr);
              });
            }
          }
          return res.status(400).json({ msg: `Image upload failed: ${uploadErr.message}` });
        }
      }
    }

    // 8. Check total image count
    const totalImageCount = validatedRetainedImages.length + uploadedAssets.length;
    if (totalImageCount < 1) {
      // Rollback uploads
      for (const asset of uploadedAssets) {
        const publicId = getImagePublicId(asset);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId).catch(rollbackErr => {
            console.error(`Rollback error destroying asset ${publicId}:`, rollbackErr);
          });
        }
      }
      return res.status(400).json({ msg: "At least 1 image is required." });
    }
    if (totalImageCount > 5) {
      // Rollback uploads
      for (const asset of uploadedAssets) {
        const publicId = getImagePublicId(asset);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId).catch(rollbackErr => {
            console.error(`Rollback error destroying asset ${publicId}:`, rollbackErr);
          });
        }
      }
      return res.status(400).json({ msg: `Maximum 5 images allowed. You have ${totalImageCount}.` });
    }

    // 9. Build final images array
    const finalImages = [...validatedRetainedImages, ...uploadedAssets];

    // 10. Update Product document
    const updateData = {};
    if (title !== undefined && title !== null) updateData.title = title.trim();
    if (description !== undefined && description !== null) updateData.description = description.trim();
    if (category !== undefined && category !== null) updateData.category = category;
    if (rentalPrice !== undefined && rentalPrice !== null) updateData.rentalPrice = Number(rentalPrice);
    
    if (product.productType === "RENT") {
      if (securityDeposit !== undefined && securityDeposit !== null) {
        updateData.securityDeposit = Number(securityDeposit);
      }
    }

    if (city !== undefined && city !== null) updateData.city = city.trim();
    if (area !== undefined && area !== null) updateData.area = area.trim();
    updateData.images = finalImages;

    // Handle location update
    if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
      const latNum = Number(latitude);
      const lngNum = Number(longitude);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        updateData.location = {
          type: "Point",
          coordinates: [lngNum, latNum]
        };
      }
    }

    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      // 11. ON SUCCESS: Determine removed images and delete from Cloudinary (best-effort)
      const originalPublicIds = (product.images || []).map(img => img.publicId);
      const retainedPublicIds = validatedRetainedImages.map(img => img.publicId);
      const removedPublicIds = originalPublicIds.filter(id => !retainedPublicIds.includes(id));

      for (const removedId of removedPublicIds) {
        cloudinary.uploader.destroy(removedId).catch(deleteErr => {
          console.error(`Best-effort Cloudinary cleanup failed for ${removedId}:`, deleteErr);
          // Don't fail the response; log and continue
        });
      }

      res.json(updatedProduct);
    } catch (updateErr) {
      // ON FAILURE: Rollback newly uploaded Cloudinary assets
      for (const asset of uploadedAssets) {
        const publicId = getImagePublicId(asset);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId).catch(rollbackErr => {
            console.error(`Rollback error destroying asset ${publicId}:`, rollbackErr);
          });
        }
      }
      throw updateErr;
    }
  } catch (err) {
    console.error("CRITICAL ERROR IN PATCH /products/:id:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ==========================================
// 2. STANDARD NEGOTIATION FLOW
// ==========================================

// Submit Initial Offer / Counter Offer
router.post("/negotiate", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId, startDate, endDate, dailyRate, securityDeposit } = req.body;

    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: "Product not found" });
    }

    // Conflict Check
    const available = await checkOverlap(productId, startDate, endDate, session);
    if (!available) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Product is already reserved during these dates!" });
    }

    const durationDays = Math.ceil(Math.abs(new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    const totalPaid = (dailyRate * durationDays) + securityDeposit;

    // Check if an active negotiation already exists
    const existingNegotiation = await Transaction.findOne({
      product: productId,
      borrower: req.userId,
      status: {
        $in: ["PENDING_NEGOTIATION", "NEGOTIATING", "ACCEPTED", "AWAITING_PAYMENT", "RESERVED"]
      }
    }).session(session);

    if (existingNegotiation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        msg: "You already have an active negotiation for this product."
      });
    }

    // Prevent owner from negotiating their own listing
    if (String(product.owner) === String(req.userId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        msg: "Owners cannot negotiate their own listings."
      });
    }

    const createdDocs = await Transaction.create([{
      product: productId,
      borrower: req.userId,
      owner: product.owner,
      startDate,
      endDate,
      dailyRate,
      securityDeposit,
      totalPaid,
      status: "PENDING_NEGOTIATION",
      negotiationHistory: [{ offeredBy: req.userId, rate: dailyRate }],
    }], { session });
    const transaction = createdDocs[0];

    // Award +3 Reputation points for the first negotiation initiated
    await awardReputation(req.userId, 3, "NEGOTIATION_INITIATED");

    // Trigger Proximity/Surge monitor check
    const recentRequestsCount = await Transaction.countDocuments({
      product: productId,
      createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // past 2 hours
    }).session(session);

    if (recentRequestsCount >= 5 && product.status === "ACTIVE") {
      // Auto Escalation — delegate to unified AuctionService
      const io = req.app?.get?.('io') || null;
      await createAuction(
        {
          productId: product._id,
          ownerId: product.owner,
          type: product.productType === "RENT" ? "RENTAL" : "SECOND_HAND",
          startingBid: product.rentalPrice,
          reservePrice: product.rentalPrice,
          durationHours: 3,
        },
        session,
        io
      );
      // Notify owner — createAuction already notifies, but add a more specific surge message
      await createNotification(
        product.owner,
        "NEW_BID",
        "Surge Demand Triggered!",
        `High demand detected. Listing "${product.title}" has been escalated to a live auction.`,
        req.userId,
        `/product/${product._id}`,
        null,
        session
      );
    } else {
      const isSecondHand = product.productType === "SECOND_HAND";
      const title = isSecondHand ? "New Purchase Request" : "New Rental Negotiation";
      const message = isSecondHand
        ? `You have received a buyout request for "${product.title}" for ₹${dailyRate}.`
        : `You have received an offer for ${product.title}.`;
      await createNotification(product.owner, "NEW_NEGOTIATION_OFFER", title, message, req.userId, `/product/${product._id}?tx=${transaction._id}`, transaction._id, session);
    }

    await session.commitTransaction();
    session.endSession();
    res.json(transaction);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ msg: err.message });
  }
});

// Resolve Negotiation (Accept/Counter/Reject)
router.post("/negotiate/:id/resolve", verifyToken, async (req, res) => {
  try {
    const { action, counterRate } = req.body; // 'ACCEPT', 'REJECT', 'COUNTER'
    const transaction = await Transaction.findById(req.params.id).populate("product");
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    // Validate requester is part of the transaction
    if (transaction.owner.toString() !== req.userId && transaction.borrower.toString() !== req.userId) {
      return res.status(403).json({ msg: "Unauthorized: You are not part of this transaction." });
    }

    if (transaction.status === "NEGOTIATION_DECLINED") {
      return res.status(400).json({ msg: "Transaction negotiation has been declined and is immutable." });
    }

    if (transaction.status !== "PENDING_NEGOTIATION") {
      return res.status(400).json({ msg: "Transaction not in negotiation state" });
    }

    const isSecondHand = transaction.product?.productType === "SECOND_HAND";

    if (action === "ACCEPT") {
      if (!isOwner(transaction, req.userId)) {
        return res.status(403).json({ msg: "Only the owner can accept an offer." });
      }
      // Transition to AWAITING_PAYMENT
      transaction.status = "AWAITING_PAYMENT";
      await transaction.save();
      const notifMsg = isSecondHand
        ? `Your purchase request for ₹${transaction.dailyRate} has been accepted! Please checkout.`
        : `Your negotiation for "${transaction.product?.title || 'Product'}" has been accepted! Please checkout.`;
      await createNotification(transaction.borrower, "OFFER_ACCEPTED", "Negotiation Accepted 🎉", notifMsg, req.userId, `/product/${transaction.product._id}?tx=${transaction._id}`, transaction._id);
    } else if (action === "COUNTER") {
      transaction.negotiationHistory.push({ offeredBy: req.userId, rate: counterRate });
      transaction.dailyRate = counterRate;
      const durationDays = Math.ceil(Math.abs(new Date(transaction.endDate) - new Date(transaction.startDate)) / (1000 * 60 * 60 * 24)) + 1;
      transaction.totalPaid = (counterRate * durationDays) + transaction.securityDeposit;
      await transaction.save();
      
      const receiver = req.userId.toString() === transaction.owner.toString() ? transaction.borrower : transaction.owner;
      const notifMsg = isSecondHand
        ? `New counter price proposal of ₹${counterRate} received.`
        : `New counter price proposal of ₹${counterRate}/day received.`;
      await createNotification(receiver, "NEW_NEGOTIATION_OFFER", "Counter Offer Made", notifMsg, req.userId, `/product/${transaction.product._id}?tx=${transaction._id}`, transaction._id);
    } else {
      if (!isOwner(transaction, req.userId)) {
        return res.status(403).json({ msg: "Only the owner can reject an offer." });
      }
      const notifMsg = isSecondHand
        ? `Your purchase request for ₹${transaction.dailyRate} has been rejected.`
        : `Your negotiation for "${transaction.product?.title || 'Product'}" has been rejected.`;
      const redirectUrl = transaction.product ? `/product/${transaction.product._id}?tx=${transaction._id}` : "";
      await createNotification(transaction.borrower, "OFFER_REJECTED", "Negotiation Rejected ❌", notifMsg, req.userId, redirectUrl, transaction._id);

      // Deduct reputation from borrower when their negotiation is rejected
      await awardReputation(transaction.borrower, -2, "NEGOTIATION_REJECTED");

      transaction.status = "NEGOTIATION_DECLINED";
      transaction.resolvedAt = new Date();
      transaction.resolvedBy = req.userId;
      await transaction.save();

      return res.json({ msg: "Offer rejected and closed.", transaction });
    }

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ==========================================
// 2B. CANCEL TRANSACTION BY BORROWER/BUYER
// ==========================================
router.post("/transaction/:id/cancel", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const transaction = await Transaction.findById(req.params.id).session(session).populate("product");
    if (!transaction) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: "Transaction not found" });
    }

    // Only borrower/buyer can cancel their own request
    if (transaction.borrower.toString() !== req.userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ msg: "Unauthorized: Only the borrower can cancel their request." });
    }

    // Check if already cancelled (idempotency)
    if (transaction.status === "CANCELLED_BY_BORROWER") {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({ msg: "Transaction already cancelled." });
    }

    // Only allow cancellation from these states
    const cancellableStatuses = ["PENDING_NEGOTIATION", "AWAITING_PAYMENT", "RESERVED"];
    if (!cancellableStatuses.includes(transaction.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ msg: `Cannot cancel transaction in ${transaction.status} status. Cancellations are only allowed before payment confirmation.` });
    }

    // Update transaction status and set cancelledAt
    transaction.status = "CANCELLED_BY_BORROWER";
    transaction.cancelledAt = new Date();
    await transaction.save({ session });

    // Award -3 reputation to borrower (idempotent due to cancelledAt check above)
    await awardReputation(transaction.borrower, -3, "REQUEST_CANCELLED", { session });

    // Notify owner
    const borrowerUser = await User.findById(transaction.borrower).session(session);
    const borrowerName = borrowerUser?.name || "A borrower";
    const productTitle = transaction.product?.title || "Product";
    const isSecondHand = transaction.product?.productType === "SECOND_HAND";
    
    const notifTitle = isSecondHand ? "Purchase Request Cancelled" : "Rental Request Cancelled";
    const notifMsg = isSecondHand
      ? `${borrowerName} has cancelled their purchase request for "${productTitle}".`
      : `${borrowerName} has cancelled their rental request for "${productTitle}".`;

    await createNotification(
      transaction.owner,
      "REQUEST_CANCELLED",
      notifTitle,
      notifMsg,
      transaction.borrower,
      `/orders`,
      transaction._id,
      session
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      msg: "Request cancelled successfully. -3 reputation deducted.",
      transaction
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error cancelling transaction:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ==========================================
// 3. SECURE CHECKOUT / ESCROW VAULT INTENT
// ==========================================
router.post("/checkout/:id", verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    if (transaction.status === "NEGOTIATION_DECLINED") {
      return res.status(400).json({ msg: "Transaction is declined and immutable." });
    }

    // Validate checkout caller is the actual borrower
    if (transaction.borrower.toString() !== req.userId) {
      return res.status(403).json({ msg: "Unauthorized: You are not the borrower for this transaction." });
    }

    // Validate transition AWAITING_PAYMENT -> RESERVED
    if (!VALID_TRANSITIONS[transaction.status]?.includes("RESERVED")) {
      return res.status(400).json({ msg: `Invalid state transition from ${transaction.status} to RESERVED` });
    }

    // Availability validation check before charging
    const available = await checkOverlap(transaction.product, transaction.startDate, transaction.endDate);
    if (!available) {
      return res.status(400).json({ msg: "This slot was booked by someone else during checkout!" });
    }

    // Simulate Stripe/Razorpay Escrow Creation
    transaction.paymentIntentId = `pi_mock_${Math.random().toString(36).substring(2, 12)}`;
    transaction.escrowStatus = "HELD";
    transaction.status = "RESERVED";
    await transaction.save();

    // Award reputation points on successful checkout confirmation
    await awardReputation(transaction.owner, 10, "TRANSACTION_COMPLETED");
    await awardReputation(transaction.borrower, 5, "TRANSACTION_COMPLETED");

    // Notify owner: security deposit is held, tell them to wait for borrower OTP
    await createNotification(
      transaction.owner,
      "ORDER",
      "Security Deposit Secured 🔒",
      `The borrower has paid the security deposit for this rental. Funds are held in escrow. Head to your Orders panel — when the borrower generates their handoff OTP, you'll need to enter it there to confirm pickup.`,
      transaction.borrower,
      "",
      transaction._id
    );

    // Notify borrower: payment went through, direct them to generate OTP
    await createNotification(
      transaction.borrower,
      "ORDER",
      "Payment Confirmed — Generate Your OTP 🎉",
      `Your security deposit has been secured in escrow. Go to your Orders panel → Renting / Buying section → click "Generate Handoff OTP" to get your pickup code. Show it to the owner to receive the item.`,
      null,
      "",
      transaction._id
    );

    res.json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ==========================================
// 4. SECURE VERIFIABLE HANDOFF & RETURN OTPS
// ==========================================

// Generate Verification OTPs
router.post("/transaction/:id/generate-otp", verifyToken, async (req, res) => {
  try {
    const { otpType } = req.body; // 'HANDOFF' or 'RETURN'
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    if (!isBorrower(transaction, req.userId)) {
      return res.status(403).json({ msg: "Only the borrower can generate rental verification codes." });
    }

    if (otpType !== "HANDOFF" && otpType !== "RETURN") {
      return res.status(400).json({ msg: "Invalid OTP type." });
    }

    if (otpType === "HANDOFF" && transaction.status !== "RESERVED") {
      return res.status(400).json({ msg: "Handoff OTPs can only be generated for reserved rentals." });
    }

    if (otpType === "RETURN" && transaction.status !== "RETURN_INITIATED") {
      return res.status(400).json({ msg: "Return OTPs can only be generated after return is initiated." });
    }

    // Rate-limit: if a valid (non-expired) OTP already exists, block re-generation.
    // This prevents duplicate notification spam without needing a separate rate-limit store.
    const now = new Date();
    if (otpType === "HANDOFF" && transaction.handoffOtpHash && transaction.handoffOtpExpiry && new Date(transaction.handoffOtpExpiry) > now) {
      const expiresIn = Math.ceil((new Date(transaction.handoffOtpExpiry) - now) / 60000);
      return res.status(429).json({
        msg: `A handoff OTP is already active. Check your notifications. It expires in ${expiresIn} minute${expiresIn === 1 ? "" : "s"}.`,
        expiry: transaction.handoffOtpExpiry,
      });
    }
    if (otpType === "RETURN" && transaction.returnOtpHash && transaction.returnOtpExpiry && new Date(transaction.returnOtpExpiry) > now) {
      const expiresIn = Math.ceil((new Date(transaction.returnOtpExpiry) - now) / 60000);
      return res.status(429).json({
        msg: `A return OTP is already active. Check your notifications. It expires in ${expiresIn} minute${expiresIn === 1 ? "" : "s"}.`,
        expiry: transaction.returnOtpExpiry,
      });
    }

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(rawOtp, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    if (otpType === "HANDOFF") {
      transaction.handoffOtpHash = hash;
      transaction.handoffOtpExpiry = expiry;
    } else {
      transaction.returnOtpHash = hash;
      transaction.returnOtpExpiry = expiry;
    }

    await transaction.save();

    // Fetch product title for notification message
    const product = await Product.findById(transaction.product).select("title productType");
    const productTitle = product?.title || "your item";
    const isSecondHand = product?.productType === "SECOND_HAND";

    const receiverId = transaction.borrower;
    const receiver = await User.findById(receiverId).select("name email");
    const receiverName = receiver?.name || "the receiving user";

    if (!receiver?.email) {
      if (otpType === "HANDOFF") {
        transaction.handoffOtpHash = undefined;
        transaction.handoffOtpExpiry = undefined;
      } else {
        transaction.returnOtpHash = undefined;
        transaction.returnOtpExpiry = undefined;
      }
      await transaction.save();
      return res.status(500).json({ msg: "Unable to send the OTP email because the receiving user has no email address on file." });
    }

    try {
      await sendMail({
        from: process.env.EMAIL_USER,
        to: receiver.email,
        subject: otpType === "HANDOFF" ? "Your Handoff OTP" : "Your Return OTP",
        html: `
          <div style="font-family:sans-serif; line-height:1.5;">
            <h2>${otpType === "HANDOFF" ? "Item Handoff Verification" : "Item Return Verification"}</h2>
            <p>Hello ${receiverName},</p>
            <p>Your ${otpType === "HANDOFF" ? "handoff" : "return"} OTP for "${productTitle}" is:</p>
            <h1>${rawOtp}</h1>
            <p>Please share this code only for the intended ${otpType === "HANDOFF" ? "handoff" : "return"} verification. It expires in 10 minutes.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      if (otpType === "HANDOFF") {
        transaction.handoffOtpHash = undefined;
        transaction.handoffOtpExpiry = undefined;
      } else {
        transaction.returnOtpHash = undefined;
        transaction.returnOtpExpiry = undefined;
      }
      await transaction.save();
      return res.status(500).json({ msg: "Failed to send the OTP email to the receiving user. Please try again." });
    }

    if (otpType === "HANDOFF") {
      // Borrower gets their OTP to show to the owner
      await createNotification(
        transaction.borrower,
        "ORDER",
        "Your Handoff OTP 🔑",
        `Your handoff code for "${productTitle}" is: ${rawOtp}. Show this to the owner to confirm pickup. Expires in 10 minutes.`,
        null,
        "",
        transaction._id
      );
      // Owner gets prompted to ask for the OTP
      await createNotification(
        transaction.owner,
        "ORDER",
        isSecondHand ? "Buyer Handoff Code Ready 📦" : "Borrower Handoff Code Ready 📦",
        `${isSecondHand ? "The buyer" : "The borrower"} has generated a handoff OTP for "${productTitle}". Ask them to show you the code, then enter it in your Orders page to confirm ${isSecondHand ? "the handover" : "pickup"}.`,
        transaction.borrower,
        "",
        transaction._id
      );
    } else {
      // Borrower gets their return OTP to show to the owner
      await createNotification(
        transaction.borrower,
        "ORDER",
        "Your Return OTP 🔄",
        `Your return code for "${productTitle}" is: ${rawOtp}. Show this to the owner to confirm the return. Expires in 10 minutes.`,
        null,
        "",
        transaction._id
      );
      // Owner gets prompted to ask for the return OTP
      await createNotification(
        transaction.owner,
        "ORDER",
        "Return Code Ready — Inspect Item 🔍",
        `The borrower has generated a return OTP for "${productTitle}". Ask them to show you the code, inspect the item, then enter the code in your Orders page to complete the return.`,
        transaction.borrower,
        "",
        transaction._id
      );
    }

    // Respond with expiry only — OTP is delivered exclusively via notification panel
    res.json({ expiry });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Verify Handoff OTP (Done by Owner scanning Borrower OTP code)
router.post("/transaction/:id/verify-handoff", verifyToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    if (!isOwner(transaction, req.userId)) {
      return res.status(403).json({ msg: "Only the owner can verify handoff." });
    }

    if (transaction.status !== "RESERVED") {
      return res.status(400).json({ msg: "Transaction not in RESERVED status" });
    }

    if (!transaction.handoffOtpHash || new Date() > new Date(transaction.handoffOtpExpiry)) {
      return res.status(400).json({ msg: "Handoff OTP is invalid or expired" });
    }

    const isMatch = await bcrypt.compare(otp, transaction.handoffOtpHash);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect validation code" });
    }

    // Unset to prevent OTP replay attacks
    transaction.status = "IN_POSSESSION";
    transaction.handoffOtpHash = undefined;
    transaction.handoffOtpExpiry = undefined;
    await transaction.save();

    await createNotification(transaction.borrower, "OTP_GENERATED", "Handoff Complete 🚀", "Rental is now active. Ensure safe usage!", null, "", transaction._id);

    res.json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Initiate Return Cycle (Borrower declares return check)
router.post("/transaction/:id/initiate-return", verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    if (!isBorrower(transaction, req.userId)) {
      return res.status(403).json({ msg: "Only the borrower can initiate return." });
    }

    if (transaction.status !== "IN_POSSESSION") {
      return res.status(400).json({ msg: "Only active rentals can be returned" });
    }

    transaction.status = "RETURN_INITIATED";
    await transaction.save();

    await createNotification(transaction.owner, "RETURN_INITIATED", "Return Initiated", "Check physical device and verify OTP to confirm return.", null, "", transaction._id);

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Complete Return Verification (Owner inspects and verifies return OTP)
router.post("/transaction/:id/verify-return", verifyToken, async (req, res) => {
  try {
    const { otp, reportDamage, damageReport, claimAmount } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    if (!isOwner(transaction, req.userId)) {
      return res.status(403).json({ msg: "Only the owner can verify returns." });
    }

    if (transaction.status !== "RETURN_INITIATED") {
      return res.status(400).json({ msg: "Return is not initiated for verification" });
    }

    if (!transaction.returnOtpHash || new Date() > new Date(transaction.returnOtpExpiry)) {
      return res.status(400).json({ msg: "Return verification code has expired" });
    }

    const isMatch = await bcrypt.compare(otp, transaction.returnOtpHash);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect verification code" });
    }

    // OTP verification valid, invalidate immediately
    transaction.returnOtpHash = undefined;
    transaction.returnOtpExpiry = undefined;

    if (reportDamage) {
      transaction.status = "DAMAGE_REVIEW";
      transaction.damageReport = damageReport;
      transaction.claimAmount = claimAmount;
      transaction.claimStatus = "FILED";
      await transaction.save();
      await createNotification(transaction.borrower, "DISPUTE_RAISED", "Damage Claim Submitted ⚠️", `Owner reported damage. Escrow deposit lock has been suspended.`, null, "", transaction._id);
      // Deduct reputation from borrower when a damage claim is filed against them
      await awardReputation(transaction.borrower, -5, "DAMAGE_CLAIM_FILED");
    } else {
      transaction.status = "SETTLED";
      transaction.escrowStatus = "RELEASED";
      transaction.refundStatus = "PROCESSED";
      transaction.payoutStatus = "PROCESSED";
      await transaction.save();

      // Free product listing back to active status
      await Product.findByIdAndUpdate(transaction.product, { status: "ACTIVE" });

      await createNotification(transaction.borrower, "SETTLEMENT_COMPLETED", "Deposit Refunded", "Deposit returned successfully!", null, "", transaction._id);
      await createNotification(transaction.owner, "SETTLEMENT_COMPLETED", "Earnings Disbursed", "Earnings are added to your wallet.", null, "", transaction._id);
    }

    res.json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Raise Dispute (Under Damage claim resolution / Dispute escalations)
router.post("/transaction/:id/dispute", verifyToken, async (req, res) => {
  try {
    const { disputeReason } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    if (!isBorrower(transaction, req.userId)) {
      return res.status(403).json({ msg: "Only the borrower can escalate a damage dispute." });
    }

    if (transaction.status !== "DAMAGE_REVIEW") {
      return res.status(400).json({ msg: "Only damage review transactions can be escalated." });
    }

    if (!disputeReason || disputeReason.trim().length < 5) {
      return res.status(400).json({ msg: "Please provide a clear dispute reason." });
    }

    transaction.status = "DISPUTED";
    transaction.disputeReason = disputeReason.trim();
    transaction.escrowStatus = "HELD_DISPUTED";
    await transaction.save();

    // Deduct reputation from both parties when a dispute is escalated
    await awardReputation(transaction.borrower, -3, "DISPUTE_RAISED");
    await awardReputation(transaction.owner, -3, "DISPUTE_RAISED");

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Chat Now - Owner wants to negotiate, creates notification for borrower
router.post("/negotiate/:id/chat-now", verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("product", "title owner")
      .populate("borrower", "name profilePic");
    
    if (!transaction) {
      return res.status(404).json({ msg: "Transaction not found" });
    }
    
    // Verify owner is making the request
    const productOwnerId = transaction.product.owner._id || transaction.product.owner;
    if (String(productOwnerId) !== String(req.userId)) {
      return res.status(403).json({ msg: "Not authorized" });
    }
    
    // IDEMPOTENCY CHECK: Check if notification already exists for this exact negotiation
    const existingNotification = await Notification.findOne({
      recipient: transaction.borrower._id,
      type: "OWNER_WANTS_TO_NEGOTIATE",
      transactionId: transaction._id
      // No time constraint - same notification should only be created once per negotiation
    });
    
    if (!existingNotification) {
      // Create notification for borrower
      await createNotification(
        transaction.borrower._id,
        "OWNER_WANTS_TO_NEGOTIATE",
        "Owner Wants to Negotiate",
        `The owner wants to discuss the rental for "${transaction.product.title}" with you.`,
        req.userId,
        `/product/${transaction.product._id}?tx=${transaction._id}`,
        transaction._id
      );
    }
    
    // Return information needed for frontend to open chat
    res.json({
      success: true,
      duplicate: !!existingNotification,
      transactionId: transaction._id.toString(),
      otherUser: {
        _id: transaction.borrower._id.toString(),
        name: transaction.borrower.name,
        profilePic: transaction.borrower.profilePic
      },
      productTitle: transaction.product.title
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Deprecated: use POST /api/admin/disputes/:id/resolve instead
router.post("/admin/disputes/:id/resolve", adminLimiter, verifyToken, requireAdmin, resolveDispute);

// ==========================================
// 5. USER MESSAGING SERVICES
// ==========================================

// Get total count of unread chat messages for the current user
router.get("/chat/unread-count", verifyToken, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.userId,
      readStatus: false,
    });
    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get Messages
router.get("/chat/:transactionId", verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    if (!isChatParticipant(transaction, req.userId)) {
      return res.status(403).json({ msg: "Access denied" });
    }

    if (!canReadChat(transaction)) {
      return res.status(400).json({ msg: `Read access is not permitted for transaction status: ${transaction.status}` });
    }

    const messages = await Message.find({ transaction: req.params.transactionId })
      .populate("sender", "name")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Mark messages in a transaction thread as read
router.post("/chat/:transactionId/read", verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });
    if (!isParticipant(transaction, req.userId)) {
      return res.status(403).json({ msg: "Access denied" });
    }

    await Message.updateMany(
      { transaction: req.params.transactionId, receiver: req.userId, readStatus: false },
      { readStatus: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Send Chat Message
router.post("/chat/:transactionId", verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

   if (!isChatParticipant(transaction, req.userId)) {
      return res.status(403).json({ msg: "Access denied" });
    }

    if (!canWriteChat(transaction)) {
      return res.status(400).json({ msg: `Sending messages is not permitted for transaction status: ${transaction.status}` });
    }

    const { content } = req.body;
    const cleanContent = typeof content === "string" ? content.trim() : "";
    if (!cleanContent || cleanContent.length > 2000) {
      return res.status(400).json({ msg: "Message content must be between 1 and 2000 characters." });
    }

    const receiverId = getChatReceiverId(transaction, req.userId);
    const message = await Message.create({
      transaction: req.params.transactionId,
      sender: req.userId,
      receiver: receiverId,
      content: cleanContent,
    });
    res.json(message);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// ==========================================
// 6. MICRO-AUCTIONS HIGH-TRAFFIC BIDDING
// Legacy endpoint — delegates to the unified auction bid handler in auctionController.
// Phase 8: this route will be removed once the frontend migrates to /api/auctions/:id/bid
// ==========================================
router.post("/auction/:productId/bid", verifyToken, async (req, res) => {
  try {
    const { amount, durationDays } = req.body;

    // Find the active auction for this product
    const auction = await Auction.findOne({ product: req.params.productId, status: "ACTIVE" });
    if (!auction) {
      return res.status(404).json({ msg: "No active auction running on this listing" });
    }

    // Forward to the unified bid endpoint internally by delegating to the controller logic
    // We do this by re-using the same request pattern the new controller expects
    req.params.id = auction._id.toString();
    req.body.idempotencyKey = req.body.idempotencyKey ||
      `${req.userId}_${auction._id}_${amount}_${Math.floor(Date.now() / 1000)}`;

    // Internal redirect — call the auction controller's bid handler via a sub-request
    const token = req.headers['authorization'];
    const backendUrl = `/api/auctions/${auction._id}/bid`;

    const result = await axios.post(backendUrl, {
      amount,
      idempotencyKey: req.body.idempotencyKey,
    }, {
      headers: { Authorization: token },
    });

    res.json(result.data.auction || result.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const msg = err.response?.data?.error || err.message;
    res.status(status).json({ msg });
  }
});

// ==========================================
// 7. USER NOTIFICATIONS ENDPOINTS
// ==========================================
router.get("/notifications", verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId, isRead: false })
      .populate("sender", "name email phone isVerified profilePic")
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Mark All Read
router.put("/notifications/read-all", verifyToken, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Mark Single Read
router.put("/notifications/:id/read", verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Mark all notifications for a specific transaction as read
router.post("/notifications/transaction/:transactionId/read", verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    // Validate ownership/involvement
    if (transaction.owner.toString() !== req.userId && transaction.borrower.toString() !== req.userId) {
      return res.status(403).json({ msg: "Access denied" });
    }

    await Notification.updateMany(
      { recipient: req.userId, transactionId: req.params.transactionId, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ==========================================
// 8. PRODUCT REVIEWS SUBMISSION
// ==========================================
router.post("/reviews", verifyToken, async (req, res) => {
  try {
    const { transactionId, targetUserId, rating, comment } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ msg: "Transaction record not found" });

    if (!isParticipant(transaction, req.userId)) {
      return res.status(403).json({ msg: "Only transaction participants can review." });
    }

    if (![transaction.owner.toString(), transaction.borrower.toString()].includes(targetUserId)) {
      return res.status(400).json({ msg: "Review target must be a transaction participant." });
    }

    if (targetUserId === req.userId) {
      return res.status(400).json({ msg: "You cannot review yourself." });
    }

    if (transaction.status !== "SETTLED") {
      return res.status(400).json({ msg: "Feedback reviews are blocked until transaction is fully settled." });
    }

    const review = await Review.create({
      reviewer: req.userId,
      targetUser: targetUserId,
      transaction: transactionId,
      rating,
      comment,
    });

    res.json(review);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get User's Active Transactions / Chats
router.get("/transactions", verifyToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const transactions = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { owner: userId },
            { borrower: userId }
          ]
        }
      },
      {
        $lookup: {
          from: "messages",
          let: { txId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$transaction", "$$txId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: "lastMessageArray"
        }
      },
      {
        $lookup: {
          from: "messages",
          let: { txId: "$_id" },
          pipeline: [
            {
              $match: {
                $and: [
                  { $expr: { $eq: ["$transaction", "$$txId"] } },
                  { receiver: userId },
                  { readStatus: false }
                ]
              }
            },
            { $count: "count" }
          ],
          as: "unreadCountArray"
        }
      },
      {
        $project: {
          product: 1,
          owner: 1,
          borrower: 1,
          startDate: 1,
          endDate: 1,
          dailyRate: 1,
          securityDeposit: 1,
          totalPaid: 1,
          status: 1,
          updatedAt: 1,
          createdAt: 1,
          lastMessage: { $arrayElemAt: ["$lastMessageArray", 0] },
          unreadCount: {
            $ifNull: [
              { $arrayElemAt: ["$unreadCountArray.count", 0] },
              0
            ]
          }
        }
      }
    ]);

    // Populate details via mongoose helper
    const populated = await Transaction.populate(transactions, [
      { path: "product", select: "title productType rentalPrice" },
      { path: "owner", select: "name email phone isVerified profilePic" },
      { path: "borrower", select: "name email phone isVerified profilePic" }
    ]);

    // Sort by latest message timestamp descending, falling back to transaction updatedAt
    populated.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
      return timeB - timeA;
    });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get specific transaction details
router.get("/transactions/:id", verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("product", "title productType rentalPrice")
      .populate("owner", "name email phone isVerified profilePic")
      .populate("borrower", "name email phone isVerified profilePic");
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    // Validate ownership/involvement
    if (transaction.owner._id.toString() !== req.userId && transaction.borrower._id.toString() !== req.userId) {
      return res.status(403).json({ msg: "Access denied" });
    }

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// --- OWNER INSIGHTS & BOOKMARKS ENDPOINTS ---

// 1. Toggle Bookmark for a product
router.post("/products/:id/bookmark", verifyToken, async (req, res) => {
  try {
    const productId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ msg: "Invalid product ID format." });
    }
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    const existingBookmark = await Bookmark.findOne({ user: req.userId, product: productId });
    if (existingBookmark) {
      await Bookmark.deleteOne({ _id: existingBookmark._id });
      return res.json({ bookmarked: false, msg: "Bookmark removed" });
    } else {
      await Bookmark.create({ user: req.userId, product: productId });
      return res.json({ bookmarked: true, msg: "Bookmark added" });
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// 2. Get all bookmarked product IDs for current user
router.get("/products/bookmarks/ids", verifyToken, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.userId }).select("product");
    res.json(bookmarks.map(b => b.product));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// 3. Get Owner Insights for a specific product
router.get("/products/:id/insights", verifyToken, async (req, res) => {
  try {
    const productId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ msg: "Invalid product ID format." });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    // Verify ownership
    if (product.owner.toString() !== req.userId) {
      return res.status(403).json({ msg: "Access denied: You are not the owner of this listing." });
    }

    // A. Saves Calculation directly from Bookmark collection
    const totalSaves = await Bookmark.countDocuments({ product: product._id });

    // B. Negotiation Analytics
    const allTxs = await Transaction.find({ product: product._id });
    const totalNegotiationRequests = allTxs.length;

    const acceptedNegotiations = allTxs.filter(tx => 
      ["AWAITING_PAYMENT", "RESERVED", "IN_POSSESSION", "RETURN_INITIATED", "DAMAGE_REVIEW", "REFUND_PROCESSING", "DISPUTED", "SETTLED"].includes(tx.status)
    ).length;

    const rejectedNegotiations = allTxs.filter(tx => tx.status === "NEGOTIATION_DECLINED").length;
    const pendingNegotiations = allTxs.filter(tx => tx.status === "PENDING_NEGOTIATION").length;

    let acceptanceRate = 0;
    if (totalNegotiationRequests > 0) {
      acceptanceRate = parseFloat(((acceptedNegotiations / totalNegotiationRequests) * 100).toFixed(1));
    }

    // C. Micro-Auction Eligibility
    const requestsLast2Hours = allTxs.filter(tx => tx.createdAt >= new Date(Date.now() - 2 * 60 * 60 * 1000)).length;
    const auctionThreshold = 5;
    const auctionProgressPercentage = Math.min(100, Math.round((requestsLast2Hours / auctionThreshold) * 100));
    const auctionEligible = requestsLast2Hours >= auctionThreshold;

    // D. Price Health
    const categoryProducts = await Product.find({ category: product.category, status: { $ne: "INACTIVE" } });
    let averageCategoryPrice = 0;
    if (categoryProducts.length > 0) {
      const sum = categoryProducts.reduce((acc, p) => acc + p.rentalPrice, 0);
      averageCategoryPrice = parseFloat((sum / categoryProducts.length).toFixed(1));
    }

    let ownerPriceDifferencePercentage = 0;
    if (averageCategoryPrice > 0) {
      ownerPriceDifferencePercentage = parseFloat((((product.rentalPrice - averageCategoryPrice) / averageCategoryPrice) * 100).toFixed(1));
    }

    let priceHealthLabel = "COMPETITIVE";
    if (ownerPriceDifferencePercentage < -10) {
      priceHealthLabel = "UNDER_MARKET";
    } else if (ownerPriceDifferencePercentage > 10) {
      priceHealthLabel = "ABOVE_MARKET";
    }

    // E. Demand Index
    const viewsWeight = 0.5;
    const savesWeight = 2.0;
    const pendingWeight = 5.0;
    const recentWeight = 12.0;

    const rawScore = (product.views || 0) * viewsWeight + 
                      totalSaves * savesWeight + 
                      pendingNegotiations * pendingWeight + 
                      requestsLast2Hours * recentWeight;

    const demandIndex = Math.min(100, Math.round(rawScore));

    let demandLabel = "LOW";
    if (demandIndex > 85) {
      demandLabel = "HOT";
    } else if (demandIndex > 65) {
      demandLabel = "HIGH";
    } else if (demandIndex > 40) {
      demandLabel = "GOOD";
    } else if (demandIndex > 20) {
      demandLabel = "MODERATE";
    }

    // F. Views calculations
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const todayBucket = (product.analytics?.dailyViews || []).find(b => {
      const d = new Date(b.date);
      d.setUTCHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
    const viewsToday = todayBucket ? todayBucket.count : 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const viewsLast7Days = (product.analytics?.dailyViews || [])
      .filter(b => new Date(b.date) >= sevenDaysAgo)
      .reduce((sum, b) => sum + b.count, 0);

    const dailyViews = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setUTCHours(0, 0, 0, 0);
      const dayStr = d.toLocaleDateString("en-US", { weekday: "short" });

      const bucket = (product.analytics?.dailyViews || []).find(b => {
        const bd = new Date(b.date);
        bd.setUTCHours(0, 0, 0, 0);
        return bd.getTime() === d.getTime();
      });

      dailyViews.push({
        day: dayStr,
        count: bucket ? bucket.count : 0
      });
    }

    res.json({
      views: product.views || 0,
      viewsToday,
      viewsLast7Days,
      totalSaves,
      totalNegotiationRequests,
      acceptedNegotiations,
      rejectedNegotiations,
      pendingNegotiations,
      acceptanceRate,
      requestsLast2Hours,
      auctionThreshold,
      auctionProgressPercentage,
      auctionEligible,
      averageCategoryPrice,
      ownerPriceDifferencePercentage,
      priceHealthLabel,
      demandIndex,
      demandLabel,
      dailyViews,
      status: product.status
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// 4. Track/increment product views with deduplication (read/write separated from GET)
router.post("/products/:id/view", async (req, res) => {
  try {
    const productId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ msg: "Invalid product ID format." });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    // Try to extract requesterId from token if present
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let viewerId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        viewerId = decoded.id;
      } catch (err) {
        // ignore invalid token, treat as guest
      }
    }

    const { anonViewerId } = req.body || {};

    // 1. Ignore owner views
    if (viewerId && product.owner.toString() === viewerId.toString()) {
      return res.json({ success: true, views: product.views, msg: "Owner view ignored" });
    }

    let isNewView = false;

    if (viewerId) {
      // Authenticated user: atomically add to viewedByUsers and increment views
      const updated = await Product.findOneAndUpdate(
        { _id: productId, viewedByUsers: { $ne: viewerId } },
        { $addToSet: { viewedByUsers: viewerId }, $inc: { views: 1 } },
        { new: true }
      );
      if (updated) isNewView = true;
    } else if (anonViewerId) {
      // Guest user
      const updated = await Product.findOneAndUpdate(
        { _id: productId, viewedByGuests: { $ne: anonViewerId } },
        { $addToSet: { viewedByGuests: anonViewerId }, $inc: { views: 1 } },
        { new: true }
      );
      if (updated) isNewView = true;
    }

    if (isNewView) {
      // Increment today's analytics bucket
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Try atomic update of today's bucket
      const bucketUpdated = await Product.updateOne(
        { _id: productId, 'analytics.dailyViews.date': { $gte: new Date(today), $lt: new Date(today.getTime() + 24*60*60*1000) } },
        { $inc: { 'analytics.dailyViews.$.count': 1 } }
      );

      if (bucketUpdated.matchedCount === 0) {
        await Product.updateOne({ _id: productId }, { $push: { 'analytics.dailyViews': { date: today, count: 1 } } });
        // Trim to last 10 entries if necessary
        const prodAfter = await Product.findById(productId);
        if (prodAfter.analytics && prodAfter.analytics.dailyViews && prodAfter.analytics.dailyViews.length > 10) {
          prodAfter.analytics.dailyViews.shift();
          await prodAfter.save();
        }
      }

      const final = await Product.findById(productId);
      return res.json({ success: true, views: final.views });
    }

    return res.json({ success: true, views: product.views });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;
