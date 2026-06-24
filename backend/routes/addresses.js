import express from "express";
import Address from "../models/Address.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET all addresses for logged-in user
router.get("/", verifyToken, async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.userId }).sort({ isDefault: -1, createdAt: -1 });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST create new address
router.post("/", verifyToken, async (req, res) => {
const {
  firstName,
  lastName,
  mobileNumber,
  houseFlatNumber,
  landmark,
  fullAddress,
  locality,
  city,
  state,
  pincode,
  addressType,
  latitude,
  longitude,
  addressDescription,
  isDefault
} = req.body;

  try {
    // Check if this is the user's first address
    const existingCount = await Address.countDocuments({ userId: req.userId });
    const makeDefault = existingCount === 0 || isDefault === true;

    if (makeDefault) {
      // Unset any previous defaults
      await Address.updateMany({ userId: req.userId }, { isDefault: false });
    }

  const newAddress = await Address.create({
  userId: req.userId,
  firstName,
  lastName,
  mobileNumber,
  houseFlatNumber,
  landmark,
  fullAddress,
  locality,
  city,
  state,
  pincode,
  addressType,
  latitude,
  longitude,
  addressDescription,
  isDefault: makeDefault
});

    res.status(201).json(newAddress);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// PUT update an address
router.put("/:id", verifyToken, async (req, res) => {
 const {
  firstName,
  lastName,
  mobileNumber,
  houseFlatNumber,
  landmark,
  fullAddress,
  locality,
  city,
  state,
  pincode,
  addressType,
  latitude,
  longitude,
  addressDescription,
  isDefault
} = req.body;

  try {
    const address = await Address.findOne({ _id: req.params.id, userId: req.userId });
    if (!address) {
      return res.status(404).json({ msg: "Address not found" });
    }

    if (isDefault === true && !address.isDefault) {
      // Unset previous defaults
      await Address.updateMany({ userId: req.userId }, { isDefault: false });
    }

    address.firstName = firstName || address.firstName;
    address.lastName = lastName || address.lastName;
    address.mobileNumber = mobileNumber || address.mobileNumber;
    address.houseFlatNumber = houseFlatNumber || address.houseFlatNumber;
    address.landmark = landmark !== undefined ? landmark : address.landmark;
    address.fullAddress = fullAddress || address.fullAddress;
    address.locality = locality !== undefined ? locality : address.locality;
    address.state = state !== undefined ? state : address.state;
    address.pincode = pincode !== undefined ? pincode : address.pincode;
    address.city = city !== undefined ? city : address.city;
    address.addressType = addressType || address.addressType;
    address.latitude = latitude !== undefined ? latitude : address.latitude;
    address.longitude = longitude !== undefined ? longitude : address.longitude;
    address.addressDescription = addressDescription !== undefined ? addressDescription : address.addressDescription;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    const saved = await address.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// PUT set default address
router.put("/:id/default", verifyToken, async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, userId: req.userId });
    if (!address) {
      return res.status(404).json({ msg: "Address not found" });
    }

    // Unset all other addresses
    await Address.updateMany({ userId: req.userId }, { isDefault: false });

    address.isDefault = true;
    const saved = await address.save();

    res.json(saved);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// DELETE address
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!address) {
      return res.status(404).json({ msg: "Address not found" });
    }

    // If deleted address was default, set another address as default if exists
    if (address.isDefault) {
      const another = await Address.findOne({ userId: req.userId });
      if (another) {
        another.isDefault = true;
        await another.save();
      }
    }

    res.json({ msg: "Address deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;
