const { body } = require('express-validator');

exports.postValidation = [
  body('content')
    .notEmpty()
    .withMessage('Content is required'),

  body('hashtags')
    .optional()
    .isArray()
    .withMessage('Hashtags must be an array of strings'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of user IDs'),

  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string'),
];
