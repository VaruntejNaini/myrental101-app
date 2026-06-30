import mongoose from "mongoose";

const auctionSchema = new mongoose.Schema(
  {
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: true, 
      index: true 
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ownerSnapshot: {
      ownerName: String,
      ownerAvatar: String,
      ownerRating: Number,
      ownerVerificationStatus: String,
    },
    status: {
      type: String,
      enum: [
        'DRAFT', 'ELIGIBLE', 'PENDING', 'ACTIVE', 'ENDED', 
        'RESERVE_NOT_MET', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED', 
        'PAYMENT_FAILED', 'PAYMENT_EXPIRED', 'PAYMENT_REFUNDED', 
        'PAYMENT_DISPUTED', 'RENTAL_CONFIRMED', 'COMPLETED', 'CANCELLED', 'EXPIRED'
      ],
      default: 'DRAFT',
      index: true
    },
    type: {
      type: String,
      enum: ['RENTAL', 'SECOND_HAND'],
      required: true,
    },
    startingBid: {
      type: Number,
      required: true,
      min: 1,
    },
    reservePrice: {
      type: Number,
      required: true,
    },
    currentHighestBid: {
      type: Number,
      default: 0,
    },
    minimumIncrement: {
      type: Number,
      required: true,
      default: 50,
    },
    highestBidderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
      index: true
    },
    durationHours: {
      type: Number,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

// Optimistic Concurrency Control
auctionSchema.pre('save', async function () {
  if (!this.isNew && this.isModified('currentHighestBid')) {
    this.version += 1;
  }
});

const Auction = mongoose.model("Auction", auctionSchema);
export default Auction;
