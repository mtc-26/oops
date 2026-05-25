/**
 * Rename collections to match ER entity names exactly.
 *   users         -> User
 *   usersecrets   -> Usersecret
 *   otpcodes      -> Otpcodes  (already matches case-insensitively, but force exact)
 *   dictionaries  -> Dictionary
 *   counters      -> (drop)
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const RENAMES: Array<[string, string]> = [
  ['users', 'User'],
  ['usersecrets', 'Usersecret'],
  ['otpcodes', 'Otpcodes'],
  ['dictionaries', 'Dictionary'],
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI!);
  const db = mongoose.connection.db!;
  const existing = (await db.listCollections().toArray()).map((c) => c.name);

  for (const [from, to] of RENAMES) {
    if (existing.includes(from) && !existing.includes(to)) {
      await db.collection(from).rename(to);
      console.log(`  renamed: ${from} -> ${to}`);
    } else if (existing.includes(from) && existing.includes(to)) {
      console.log(`  skipped: ${from} (target ${to} already exists — merge manually)`);
    } else if (existing.includes(to)) {
      console.log(`  ok:      ${to} already exists`);
    } else {
      console.log(`  skipped: ${from} (not found)`);
    }
  }

  if (existing.includes('counters')) {
    await db.dropCollection('counters');
    console.log(`  dropped: counters`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
