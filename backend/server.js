import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./db/db.js";
import { RegisterUser, LoginUser, LogoutUser, RefreshToken, GetMe, FirebaseGoogleLogin, UpdateUserProfile, ChangePassword } from "./controllers/Auth/authController.js";
import aiRoutes from "./routes/aiRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { verifyToken } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:8081"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(cookieParser());

// Connect Database
connectDB();



// Routes
app.post("/api/auth/register", RegisterUser);
app.post("/api/auth/login", LoginUser);
app.post("/api/auth/logout", LogoutUser);
app.post("/api/auth/firebase-google", FirebaseGoogleLogin);
app.post("/api/auth/refresh", RefreshToken);
app.get("/api/auth/me", verifyToken, GetMe);
app.put("/api/auth/profile", verifyToken, UpdateUserProfile);
app.post("/api/auth/change-password", verifyToken, ChangePassword);

app.use("/api/reports", reportRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/notifications", verifyToken, notificationRoutes);
app.use("/api/ai", verifyToken, aiRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", verifyToken, adminRoutes);


// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});