const { body } = require('express-validator');

exports.registerValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.loginValidation = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('Username or email is required'),

  body('password')
    .notEmpty().withMessage('Password is required'),
];
