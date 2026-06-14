import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true, index: true },
    content: { type: String, required: true },
    readStatus: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Compound index for optimizing unread message count queries
messageSchema.index({ receiver: 1, readStatus: 1 });

// Index for optimizing chat history retrieval and finding latest message
messageSchema.index({ transaction: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;

