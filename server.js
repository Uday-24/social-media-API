const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./backend/config/db');
const authRoutes = require('./backend/routes/authRoutes');
const userRoutes = require('./backend/routes/userRoutes');
const profileRoutes = require('./backend/routes/profileRoutes');
const followRoutes = require('./backend/routes/followRoutes');
const errorHandler = require('./backend/middlewares/errorMiddleware');

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/follow', followRoutes);
app.use(errorHandler);

// Start server after DB connection
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
