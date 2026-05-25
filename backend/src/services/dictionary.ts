import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, isAbsolute } from 'node:path';
import { Dictionary } from '../models/dictionary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');

const fileCache = new Map<string, Set<string>>();

function loadFile(filename: string): Set<string> {
  const path = isAbsolute(filename) ? filename : join(DATA_DIR, filename);
  let set = fileCache.get(path);
  if (set) return set;
  const text = readFileSync(path, 'utf-8');
  set = new Set(
    text
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  );
  fileCache.set(path, set);
  return set;
}

export async function dictionaryCheck(password: string, dicts?: string[]) {
  const filter = dicts && dicts.length > 0 ? { dictname: { $in: dicts } } : {};
  const all = await Dictionary.find(filter);

  const results: Record<string, boolean> = {};
  const checked: string[] = [];
  let foundAny = false;

  for (const d of all) {
    let found = false;
    try {
      const set = loadFile(d.dictfile);
      found = set.has(password) || set.has(password.toLowerCase());
    } catch (err) {
      console.error(`Failed to load dict ${d.dictname} (${d.dictfile}):`, err);
    }
    results[d.dictname] = found;
    checked.push(d.dictname);
    if (found) foundAny = true;
  }

  return {
    safe: !foundAny,
    leaked: foundAny,
    results,
    dictsChecked: checked,
  };
}
