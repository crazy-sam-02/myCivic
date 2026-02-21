import bcrypt from "bcrypt";
import User from "../../models/user.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

const buildAccessToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRECT_KEY,
    { expiresIn: ACCESS_TOKEN_TTL },
  );

const buildRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL },
  );

export const RegisterUser = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "please Enter All the Fields",
        success: false,
      });
    }
    const ExistingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (ExistingUser) {
      console.log("the user already exist !");
      return res.status(409).json({
        message: "The User Already Exist",
        success: false
      });
    }
    const salt = await bcrypt.genSalt(10);
    const HashPassword = await bcrypt.hash(password, salt);

    const NewUser = new User({
      username,
      email,
      role: role || "user",
      password: HashPassword,
    });

    const SavedUser = await NewUser.save();

    const accessToken = buildAccessToken(SavedUser);
    const refreshToken = buildRefreshToken(SavedUser);
    SavedUser.refreshToken = refreshToken;
    await SavedUser.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "New User is Created Successfully",
      success: true,
      token: accessToken,
      user: {
        id: SavedUser._id,
        username: SavedUser.username,
        email: SavedUser.email,
        location: SavedUser.location || "",
        role: SavedUser.role,
        createdAt: SavedUser.createdAt,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "there is Error While Registering User",
      success: false,
    });
  }
};

export const LoginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({
        message: "Please Enter All The Fields",
        success: false,
      });
    }
    const ExistingUser = await User.findOne({ email });
    if (!ExistingUser) {
      return res.status(404).json({
        message: "The User Does Not Exist",
        success: false,
      });
    }
    const ComparePass = await bcrypt.compare(password, ExistingUser.password);
    if (!ComparePass) {
      return res.status(401).json({
        message: "Password is Incorrect",
        success: false,
      });
    }
    const accessToken = buildAccessToken(ExistingUser);
    const refreshToken = buildRefreshToken(ExistingUser);
    ExistingUser.refreshToken = refreshToken;
    await ExistingUser.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "The user Is Logged in Successfully",
      success: true,
      token: accessToken,
      user: {
        id: ExistingUser._id,
        username: ExistingUser.username,
        email: ExistingUser.email,
        location: ExistingUser.location || "",
        role: ExistingUser.role,
        createdAt: ExistingUser.createdAt,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: " There is Error Occured While Login ",
      success: false,
    });
  }
};

export const LogoutUser = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const user = await User.findOne({ refreshToken: token });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
    });
    return res.status(200).json({
      success: true,
      message: "Logout Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "There is Error ocurred while Logout",
    });
  }
};

export const RefreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "No refresh token" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    const accessToken = buildAccessToken(user);
    return res.status(200).json({ success: true, token: accessToken });
  } catch (error) {
    return res.status(401).json({ success: false, message: "Refresh token expired" });
  }
};

export const GetMe = async (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
};

export const FirebaseGoogleLogin = async (req, res) => {
  const { email, name, firebaseUid } = req.body;
  try {
    console.log("Firebase Google Login Request:", { email, name, firebaseUid });
    
    if (!email || !firebaseUid) {
      return res.status(400).json({
        message: "Email and Firebase UID are required",
        success: false,
      });
    }

    let user = await User.findOne({ $or: [{ email }, { firebaseUid }] });

    if (!user) {
      // Create new user from Firebase Google login
      const baseName = (name || email.split("@")[0]).replace(/\s+/g, "").toLowerCase();
      let username = baseName;
      const existingUser = await User.findOne({ username });
      
      if (existingUser) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        username = `${baseName}${randomSuffix}`;
      }

      user = new User({
        username: username,
        email: email,
        password: null, // No password for Firebase users
        authProvider: "firebase",
        firebaseUid: firebaseUid,
        role: "user",
      });

      const savedUser = await user.save();
      console.log("New Firebase user created:", {
        userId: savedUser._id,
        email: savedUser.email,
        firebaseUid: savedUser.firebaseUid,
        authProvider: savedUser.authProvider,
      });
    } else if (!user.firebaseUid) {
      // Update existing user with firebaseUid
      user.firebaseUid = firebaseUid;
      user.authProvider = "firebase";
      const updatedUser = await user.save();
      console.log("Existing user updated with firebaseUid:", {
        userId: updatedUser._id,
        email: updatedUser.email,
        firebaseUid: updatedUser.firebaseUid,
      });
    } else {
      console.log("Existing Firebase user logging in:", {
        userId: user._id,
        email: user.email,
        firebaseUid: user.firebaseUid,
      });
    }

    const accessToken = buildAccessToken(user);
    const refreshToken = buildRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // Set to true in production
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log("Firebase Google Login Success:", {
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      message: "Logged in with Google successfully",
      success: true,
      token: accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        location: user.location || "",
        role: user.role,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.log("Firebase Google Login Error:", error.message);
    console.error("Full Error:", error);
    return res.status(500).json({
      message: "Error during Firebase Google login",
      success: false,
      error: error.message
    });
  }
};

export const UpdateUserProfile = async (req, res) => {
  try {
    const { name, location } = req.body;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (name) user.username = name;
    if (location) user.location = location;

    const updatedUser = await user.save();

    console.log("User profile updated:", {
      userId: updatedUser._id,
      username: updatedUser.username,
      location: updatedUser.location,
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        location: updatedUser.location,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.log("Update Profile Error:", error);
    return res.status(500).json({
      message: "Error updating profile",
      success: false,
      error: error.message,
    });
  }
};

export const ChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New passwords do not match",
        success: false,
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
        success: false,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Check if user has a password (not a social auth user)
    if (!user.password) {
      return res.status(400).json({
        message: "Cannot change password for social login accounts",
        success: false,
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Current password is incorrect",
        success: false,
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;

    await user.save();

    console.log("Password changed successfully for user:", userId);

    return res.status(200).json({
      message: "Password changed successfully",
      success: true,
    });
  } catch (error) {
    console.log("Change Password Error:", error);
    return res.status(500).json({
      message: "Error changing password",
      success: false,
      error: error.message,
    });
  }
};
