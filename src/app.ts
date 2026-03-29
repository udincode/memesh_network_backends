import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser"; // ✅ penting untuk membaca cookie jwt

import authRoutes from "./routes/authRoutes";
import chatRoutes from "./routes/chatRoutes";
import messageRoutes from "./routes/messageRoutes";
import userRoutes from "./routes/userRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();


app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "15mb" }));
app.use(cookieParser()); // ✅ untuk membaca req.cookies.jwt

// ✅ clerkMiddleware dihapus

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

app.use(errorHandler);

// serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../web/dist")));
  app.get("/{*any}", (_, res) => {
    res.sendFile(path.join(__dirname, "../../web/dist/index.html"));
  });
}

export default app;