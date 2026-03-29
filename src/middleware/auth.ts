import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const protectRoute = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Cek cookie (untuk web)
    let token = req.cookies?.jwt;

    // 2. Cek Authorization header (untuk mobile)
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Tidak terautentikasi" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    const user = await User.findById(decoded.userId).select("-secretHash");
    if (!user) {
      return res.status(401).json({ message: "User tidak ditemukan" });
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Token tidak valid" });
  }
};