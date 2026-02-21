import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRECT_KEY);
        } catch (jwtError) {
            console.log("JWT verification failed:", jwtError.message);
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired token" });
        }

        if (!decoded) {
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
        }

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log("Error in verifyToken middleware: ", error.message);
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
};

export const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Forbidden: Admin access only" });
    }
};

export const verifyRole = (...roles) => (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
        return next();
    }
    return res.status(403).json({ success: false, message: "Forbidden: Insufficient role" });
};
