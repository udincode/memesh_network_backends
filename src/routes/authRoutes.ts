import express from "express";
import {
  signup,
  login,
  logout,
  checkAuth,
  updateProfile,
  getUserProfile,
} from "../controllers/authController";
import { protectRoute } from "../middleware/auth";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/check", protectRoute, checkAuth);
router.put("/update-profile", protectRoute, updateProfile);
router.get("/profile/:userId", protectRoute, getUserProfile);

export default router;