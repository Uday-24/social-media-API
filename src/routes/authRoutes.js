const express = require('express');
const { register, login, refreshToken, logout } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../validations/authValidator');
const { validateRequest } = require('../validations/validateErrors');
const router = express.Router();

router.post('/register',registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.get('/refresh-token', refreshToken);
router.post('/logout', logout);

module.exports = router;