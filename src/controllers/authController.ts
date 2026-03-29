import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { generateSecretKey, generateAnonymousId } from "../utils/identity";
import { AuthRequest } from "../middleware/auth";

// Optional: jika pakai cloudinary
import cloudinary from "../lib/cloudinary";

export const signup = async (req: AuthRequest, res: Response) => {
  try {
    const secretKey = generateSecretKey();

    let anonymousId: string;
    let exists = true;
    while (exists) {
      anonymousId = generateAnonymousId();
      exists = !!(await User.findOne({ anonymousId }));
    }

    const salt = await bcrypt.genSalt(10);
    const secretHash = await bcrypt.hash(secretKey, salt);

    const newUser = new User({
      anonymousId,
      secretHash,
      displayName: "Anonymous",
      profilePic: "",
      bio: "",
    });
    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Set cookie untuk web
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(201).json({
      _id: newUser._id,
      anonymousId: newUser.anonymousId,
      displayName: newUser.displayName,
      profilePic: newUser.profilePic,
      bio: newUser.bio,
      secretKey, // penting: hanya muncul sekali saat signup
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { anonymousId, secretKey } = req.body;
    if (!anonymousId || !secretKey) {
      return res.status(400).json({ message: "anonymousId dan secretKey wajib diisi" });
    }

    const user = await User.findOne({ anonymousId });
    if (!user) {
      return res.status(401).json({ message: "Anonymous ID tidak valid" });
    }

    const match = await bcrypt.compare(secretKey, user.secretHash);
    if (!match) {
      return res.status(401).json({ message: "Secret key tidak valid" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      _id: user._id,
      anonymousId: user.anonymousId,
      displayName: user.displayName,
      profilePic: user.profilePic,
      bio: user.bio,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (req: AuthRequest, res: Response) => {
  res.cookie("jwt", "", { maxAge: 0, path: "/" });
  res.json({ message: "Logged out successfully" });
};

export const checkAuth = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select("-secretHash");
    res.json(user);
  } catch (error) {
    console.error("Check auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, bio, profilePic } = req.body;
    const userId = req.user?._id;

    const updateData: any = {};
    if (displayName) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;

    if (profilePic) {
      // Jika pakai cloudinary, uncomment:
      // const uploadResponse = await cloudinary.uploader.upload(profilePic);
      // updateData.profilePic = uploadResponse.secure_url;
      updateData.profilePic = profilePic; // sementara asumsikan URL sudah siap
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-secretHash");

    // Emit event via Socket.IO jika tersedia
    const io = req.app.get("io");
    if (io) {
      io.emit("profileUpdated", {
        userId: updatedUser!._id,
        displayName: updatedUser!.displayName,
        bio: updatedUser!.bio,
        profilePic: updatedUser!.profilePic,
      });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-secretHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};