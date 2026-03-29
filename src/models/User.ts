import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  anonymousId: string;
  secretHash: string;
  displayName: string;
  profilePic: string;
  bio: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    anonymousId: {
      type: String,
      required: true,
      unique: true,
    },
    secretHash: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      default: "Anonymous",
    },
    profilePic: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);