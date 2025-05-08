// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');

dotenv.config();
const app = express();


// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);


// Api Routes
app.get('/', (req, res)=>{
    res.status(200).json({message: 'Welcome to social media app'});
});


// Connect db and start server
connectDB();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server is running"));