const { body } = require('express-validator');

exports.validateProfileUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Name must be at most 50 characters'),

    body('bio')
        .optional()
        .trim()
        .isLength({ max: 160 })
        .withMessage('Bio must be at most 160 characters'),

    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Location must be at most 100 characters'),

    body('gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('Gender must be male, female, or other'),

    body('dob')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('Date of Birth must be a valid date (YYYY-MM-DD)'),

    body('isPrivate')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('isPrivate must be true or false'),

    body('interests')
        .optional()
        .custom((value) => {
            if (Array.isArray(value)) {
                return true;
            }
            if (typeof value === 'string') {
                return true; // comma separated
            }
            throw new Error('Interests must be an array or comma-separated string');
        }),
];
