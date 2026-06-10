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

const Message = mongoose.model("Message", messageSchema);
export default Message;
