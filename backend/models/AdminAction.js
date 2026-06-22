import mongoose from "mongoose";

const adminActionSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actionType: { type: String, required: true, index: true },
    targetType: { type: String, required: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    summary: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const AdminAction = mongoose.model("AdminAction", adminActionSchema);
export default AdminAction;
