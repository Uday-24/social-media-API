require('dotenv').config();
const express = require('express');
const {connectDB} = require('./src/config/db');
const cookieParser = require('cookie-parser');

const authRoutes = require('./src/routes/authRoutes');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();
connectDB();

app.use(express.json());
app.use(cookieParser());

// Routes middlewares
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => {
    res.json({ success: true, messgae: 'Social Media Api working' });
});

// Cenntralized Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('Server is running on port 5000');
});