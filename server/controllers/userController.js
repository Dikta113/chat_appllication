import { generateToken } from '../lib/utils.js';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';

// Signup a new user
export const signup = async (req, res) => {
    const { fullName, email, password, bio } = req.body;

    try {
        if (!fullName || !email || !password) {
            return res.json({ success: false, message: "Missing details" })
        }
        const user = await User.findOne({ email });

        if (user) {
            return res.json({ success: false, message: "Account already exists" })
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName, email, password: hashedPassword, bio
        });

        const token = generateToken(newUser._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        });

        res.json({
            success: true,
            userData: newUser,
            message: "Account created successfully"
        });
    }
    catch (error) {
        console.log(error);
        res.json({ success: true, message: error.message })
    }
}

// Controller to login a user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email });

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if (!isPasswordCorrect) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = generateToken(userData._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // true in production
            sameSite: "lax"
        });

        res.json({
            success: true,
            userData,
            message: "Login successful"
        });
    } catch (error) {
        console.log(error);
        res.json({ success: true, message: error.message })
    }
}

// Controller to check if user is authenticated
export const checkAuth = async (req, res) => {
    res.json({ success: true, user: req.user })
}

// Controller to update user profile details
export const updateProfile = async (req, res) => {
    try {
        const { fullName, bio, profilePic } = req.body;

        let imageUrl;

        // ✅ Upload to Cloudinary if image exists
        if (profilePic) {
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            imageUrl = uploadResponse.secure_url;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                fullName,
                bio,
                ...(imageUrl && { profilePic: imageUrl }) // ✅ save URL, not base64
            },
            { new: true }
        );

        res.json({ success: true, user: updatedUser });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};
