import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  clearGeneratedData,
  getPreferences,
  initializeStore,
  listDaily,
  listRecords,
  saveDaily,
  savePreferences,
  saveRecord,
} from '../server/file-store.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacyPath = path.join(rootDir, 'data', 'db.json');
const force = process.argv.includes('--force');

async function migrateCollection(name, records = []) {
  for (let index = 0; index < records.length; index += 1) {
    await saveRecord(name, {
      ...records[index],
      sortOrder: records[index].sortOrder ?? index,
    });
  }
}

async function main() {
  await initializeStore();

  const existingCount = (
    await Promise.all([
      listRecords('problems'),
      listRecords('adhocProblems'),
      listRecords('notes'),
      listDaily(),
    ])
  ).reduce((total, records) => total + records.length, 0);

  if (existingCount > 0 && !force) {
    throw new Error('File datastore already contains records. Use --force to replace it.');
  }

  const legacyData = JSON.parse(await fs.readFile(legacyPath, 'utf8'));
  if (force) await clearGeneratedData();

  await migrateCollection('problems', legacyData.problems);
  await migrateCollection('adhocProblems', legacyData.adhocProblems);
  await migrateCollection('notes', legacyData.notes);

  for (const record of legacyData.daily || []) {
    await saveDaily(record);
  }

  const preferences = Array.isArray(legacyData.preferences)
    ? legacyData.preferences.find((record) => record.id === 'user') || legacyData.preferences[0]
    : legacyData.preferences;
  if (preferences) await savePreferences(preferences);

  const migrated = {
    problems: (await listRecords('problems')).length,
    adhocProblems: (await listRecords('adhocProblems')).length,
    notes: (await listRecords('notes')).length,
    daily: (await listDaily()).length,
    preferences: Object.keys(await getPreferences()).length > 0 ? 1 : 0,
  };

  const expected = {
    problems: legacyData.problems?.length || 0,
    adhocProblems: legacyData.adhocProblems?.length || 0,
    notes: legacyData.notes?.length || 0,
    daily: legacyData.daily?.length || 0,
    preferences: preferences ? 1 : 0,
  };

  if (JSON.stringify(migrated) !== JSON.stringify(expected)) {
    throw new Error(`Migration verification failed: ${JSON.stringify({ expected, migrated })}`);
  }

  console.log('Migration complete:', migrated);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
