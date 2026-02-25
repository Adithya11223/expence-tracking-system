const userModel = require('../models/userModel');

// Login Controller
const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        const user = await userModel.findOne({ email: email.trim().toLowerCase(), password });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found. Check your email and password.' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error during login' });
    }
};

// Register Controller
const registerController = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        }
        // Check if user already exists
        const existing = await userModel.findOne({ email: email.trim().toLowerCase() });
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in.' });
        }
        const newUser = new userModel({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
        });
        await newUser.save();
        res.status(201).json({ success: true, newUser });
    } catch (error) {
        console.error('Register error:', error);
        res.status(400).json({ success: false, message: error.message || 'Registration failed' });
    }
};

// Update Profile Controller
const updateProfileController = async (req, res) => {
    try {
        const { userId, updateData } = req.body;
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, message: 'Profile Updated Successfully', user: updatedUser });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(400).json({ success: false, message: error.message || 'Profile update failed' });
    }
};

module.exports = { loginController, registerController, updateProfileController };