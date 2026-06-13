import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // BASIC INFO

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // EMAIL OTP

    emailOtp: {
      type: String,
      default: "",
    },

    emailOtpExpiry: {
      type: Date,
      default: null,
    },

    emailOtpAttempts: {
      type: Number,
      default: 0,
    },

    // MOBILE OTP

    mobileOtp: {
      type: String,
      default: "",
    },

    mobileOtpExpiry: {
      type: Date,
      default: null,
    },

    mobileOtpAttempts: {
      type: Number,
      default: 0,
    },

    // VERIFICATION STATUS

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isMobileVerified: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    profilePic: {
      type: String,
      default: "",
    },
  },

  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;