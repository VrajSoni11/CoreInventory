require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔄 Connecting to MongoDB...');
console.log('URI:', process.env.MONGODB_URI ? '✅ Found in .env' : '❌ NOT found in .env');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    console.log('📦 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection Failed!');
    console.error('Error:', err.message);
    process.exit(1);
  });