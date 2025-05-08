const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign({ id: user._id, username: user.username, email:user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// @route POST api/auth/register
const register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        
        const existingUser = await User.findOne({
            $or: [
                { email: email },
                { username: username }
            ]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Email or user already exists' });
        }

        const user = await User.create({ username, email, password });
        console.log('Hello');
        res.status(201).json({
            token: generateToken(user),
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

// @route POST api/auth/login
const login = async (req, res) => {
    const { identifier, password } = req.body;

    try {
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { username: identifier }
            ]
        });

        if (!user || !(await user.matchPassword(password)))
            return res.status(401).json({ message: 'Invalid credentials' });

        res.status(200).json({
            token: generateToken(user._id),
            user: { id: user._id, username: user.username, email: user.email }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

module.exports = {
    register,
    login
}