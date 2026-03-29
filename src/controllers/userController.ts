import { Response } from "express";
import { User } from "../models/User";
import { AuthRequest } from "../middleware/auth";

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId;
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("anonymousId displayName profilePic bio")
      .limit(50);
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};