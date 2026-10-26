import mongoose from 'mongoose';

let memoryServer = null;

export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  if (process.env.USE_MEMORY_DB === 'true') {
    const { MongoMemoryReplSet } = await import('mongodb-memory-server');
    // Replica set (wiredTiger) so multi-document transactions work in-memory.
    memoryServer = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
    await mongoose.connect(memoryServer.getUri());
    console.log('MongoDB connected (in-memory demo)');
    return;
  }
  const finalUri = uri || process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!finalUri) throw new Error('MONGO_URI missing');

  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));

  await mongoose.connect(finalUri);
  console.log(`MongoDB connected to [${mongoose.connection.host}/${mongoose.connection.name}]`);
}

export async function stopMemory() {
  if (memoryServer) await memoryServer.stop();
}
