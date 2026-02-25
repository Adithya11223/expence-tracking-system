const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors'); // ADDED: Needed to prevent connection errors
const path = require('path'); // ADDED: Needed to connect frontend and backend folders
const connectDb = require('./config/connectDb');

// config dot env
dotenv.config();

// database call
connectDb();

// rest object
const app = express();

// middlewares
app.use(cors()); // ADDED: Turns on the CORS security fix
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' })); 

// routes
// User routes
app.use('/users', require('./routes/userRoutes'));

// Transaction routes
app.use('/api/v1/transaction', require('./routes/transactionRoutes'));

// Khatabook routes
app.use('/api/v1/khatabook', require('./routes/khatabookRoutes'));

// --- ADDED: This tells the backend to show your React frontend ---
app.use(express.static(path.join(__dirname, './client/build')));
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, './client/build/index.html'));
});
// -----------------------------------------------------------------

// port (FIXED: process.env.PORT must be first)
const PORT = process.env.PORT || 8080;

// listen server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});