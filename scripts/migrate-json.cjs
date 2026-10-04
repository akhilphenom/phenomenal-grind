const fs = require('node:fs');
const path = require('node:path');
const { FileStore } = require('../server/file-store.cjs');

const databasePath = process.argv[2] || path.join(__dirname, '..', 'data', 'db.json');
const dataDirectory = process.argv[3] || path.dirname(databasePath);

if (!fs.existsSync(databasePath)) {
  console.error(`Legacy database not found: ${databasePath}`);
  process.exitCode = 1;
} else {
  const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
  new FileStore(dataDirectory).importLegacy(database);
  console.log(`Migrated ${databasePath} to Markdown, CSV, and INI files in ${dataDirectory}`);
}
