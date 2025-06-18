const { body } = require('express-validator');

exports.registerValidation = [
    body('email')
    .isEmail()
    .withMessage('Invalid Email'),
    
    body('password')
    .isLength({min:6})
    .withMessage('Password must have at least 6 characters'),
    
    body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({min:3, max:15})
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must contain only letters, numbers, and underscores')
]

exports.loginValidation = [
    body('identifier').isLength({min: 3}).withMessage('Invalid credentials'),
    body('password').isLength({min: 6}).withMessage('Invalid credentials')
]