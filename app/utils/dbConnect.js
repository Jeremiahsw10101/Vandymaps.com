// utils/dbConnect.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Global is used here to maintain a cached connection across hot reloads
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // If no MongoDB URI is provided, return a dummy connection object
  // This allows the app to function without database connectivity
  if (!MONGODB_URI) {
    console.warn('No MongoDB URI provided. Database features will be disabled.');
    return {
      connection: {
        isConnected: false
      }
    };
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, options)
      .then(mongoose => {
        console.log('Connected to MongoDB');
        return mongoose;
      })
      .catch(error => {
        console.error('Error connecting to MongoDB:', error);
        // Return a dummy connection instead of throwing an error
        return {
          connection: {
            isConnected: false
          }
        };
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
