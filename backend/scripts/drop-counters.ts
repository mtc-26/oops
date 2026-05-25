/**
 * Drop the counters collection — no longer needed since IDs are random.
 * Run with:  npx tsx scripts/drop-counters.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  const existing = (await db.listCollections().toArray()).map((c) => c.name);

  if (existing.includes('counters')) {
    await db.dropCollection('counters');
    console.log('  dropped: counters');
  } else {
    console.log('  skipped: counters (not found)');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
