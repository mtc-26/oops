import 'dotenv/config';
import mongoose from 'mongoose';

async function main() {
  await mongoose.connect(process.env.MONGO_URI!);
  const db = mongoose.connection.db!;
  const cols = await db.listCollections().toArray();
  for (const c of cols) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`${c.name} (${count} docs)`);
    if (count <= 5) {
      const docs = await db.collection(c.name).find().toArray();
      for (const d of docs) console.log('   ', JSON.stringify(d));
    }
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
