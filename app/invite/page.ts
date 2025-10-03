// lib/mongoose.ts
import mongoose from 'mongoose';


const MONGODB_URI = process.env.MONGODB_URI || 'YOUR_MONGODB_CONNECTION_STRING_HERE';


if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}


/**
* Mongoose connection helper for Next.js (prevents multiple connections during hot reload)
*/
let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = (global as any).mongoose || { conn: null, promise: null };


if (!cached.promise) {
  const opts = {
    // useNewUrlParser and useUnifiedTopology are default in mongoose >=6
  };
  cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
    return mongoose;
  });
}


async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }
  cached.conn = await cached.promise;
  (global as any).mongoose = cached;
  return cached.conn;
}


export default dbConnect;