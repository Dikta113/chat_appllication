import User from '../models/user.js';
import jwt from 'jsonwebtoken';

//Middleware to protect routes
export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.token; // ✅ from cookies

    console.log("TOKEN:", token); // ✅ debug

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error.message);
    res.status(401).json({ message: error.message });
  }
};
