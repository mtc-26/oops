import { Dictionary } from '../models/dictionary.js';

const SEED = [
  { dictname: 'rockyou', dictfile: 'rockyou.txt' },
];

export async function seedDictionariesIfEmpty(): Promise<void> {
  const count = await Dictionary.estimatedDocumentCount();
  if (count > 0) return;
  for (const s of SEED) {
    await Dictionary.create(s);
  }
  console.log(`📖 Seeded ${SEED.length} dictionaries`);
}
