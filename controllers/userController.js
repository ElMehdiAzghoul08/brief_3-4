const User = require('../models/user');
const emailService = require('../services/emailService');
const crypto = require('crypto');

exports.createUser = async (req, res) => {
    try {
        const user = new User(req.body);
        const token = crypto.randomBytes(20).toString('hex');
        user.emailVerificationToken = token;
        await user.save();
        await emailService.sendVerificationEmail(user.email, token);
        res.status(201).json({ message: 'User created. Please check your email to verify your account.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid login credentials' });
        }
        if (!user.emailVerified) {
            return res.status(401).json({ message: 'Please verify your email before logging in' });
        }
        const token = await user.generateAuthToken();
        res.json({ user, token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({ emailVerificationToken: req.params.token });
        if (!user) return res.status(400).json({ message: 'Invalid token' });
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();
        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.requestPasswordReset = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const token = crypto.randomBytes(20).toString('hex');
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        await user.save();
        await emailService.sendPasswordResetEmail(user.email, token);
        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const user = await User.findOne({
            passwordResetToken: req.params.token,
            passwordResetExpires: { $gt: Date.now() }
        });
        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};