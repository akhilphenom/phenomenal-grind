import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(rootDir, 'data');

export const paths = {
  data: dataDir,
  problems: path.join(dataDir, 'problems'),
  adhocProblems: path.join(dataDir, 'adhoc-problems'),
  notes: path.join(dataDir, 'notes'),
  daily: path.join(dataDir, 'daily'),
  preferences: path.join(dataDir, 'preferences.yaml'),
};

const collectionConfig = {
  problems: {
    directory: paths.problems,
    textFields: ['notes', 'code'],
    codeField: 'code',
    languageField: 'language',
  },
  adhocProblems: {
    directory: paths.adhocProblems,
    textFields: ['notes', 'code'],
    codeField: 'code',
    languageField: 'language',
  },
  notes: {
    directory: paths.notes,
    textFields: ['content', 'rough', 'code'],
    codeField: 'code',
    languageField: 'codeLanguage',
  },
};

function assertSafeId(id) {
  if (
    (typeof id !== 'string' && typeof id !== 'number')
    || !/^[a-zA-Z0-9._-]+$/.test(String(id))
  ) {
    throw new Error(`Invalid record id: ${id}`);
  }
}

function recordPath(directory, id, extension) {
  assertSafeId(id);
  return path.join(directory, `${String(id)}.${extension}`);
}

async function ensureDirectory(directory) {
  await fs.mkdir(directory, { recursive: true });
}

async function atomicWrite(filePath, content) {
  await ensureDirectory(path.dirname(filePath));
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, content, 'utf8');
  await fs.rename(temporaryPath, filePath);
}

function splitFrontMatter(source) {
  if (!source.startsWith('---\n')) {
    throw new Error('Markdown record is missing YAML front matter');
  }

  const end = source.indexOf('\n---\n', 4);
  if (end === -1) {
    throw new Error('Markdown record has invalid YAML front matter');
  }

  return {
    metadata: YAML.parse(source.slice(4, end)) || {},
    body: source.slice(end + 5),
  };
}

function sectionMarker(name, edge) {
  return `<!-- PHENOMENAL-GRIND:${name.toUpperCase()}:${edge} -->`;
}

function readSection(body, name) {
  const startMarker = sectionMarker(name, 'START');
  const endMarker = sectionMarker(name, 'END');
  const start = body.indexOf(startMarker);
  const end = body.indexOf(endMarker);

  if (start === -1 || end === -1 || end < start) {
    return '';
  }

  return body.slice(start + startMarker.length, end).replace(/^\n|\n$/g, '');
}

function writeSection(name, value) {
  return [
    sectionMarker(name, 'START'),
    value || '',
    sectionMarker(name, 'END'),
  ].join('\n');
}

function stripCodeFence(value) {
  const match = value.match(/^```[^\n]*\n([\s\S]*?)\n```$/);
  return match ? match[1] : value;
}

function markdownRecord(record, config) {
  const metadata = { ...record };
  const sections = [];

  for (const field of config.textFields) {
    const value = metadata[field] || '';
    delete metadata[field];

    if (field === config.codeField) {
      const language = record[config.languageField] || 'text';
      sections.push(writeSection(field, `\`\`\`${language}\n${value}\n\`\`\``));
    } else {
      sections.push(writeSection(field, value));
    }
  }

  return `---\n${YAML.stringify(metadata).trimEnd()}\n---\n\n${sections.join('\n\n')}\n`;
}

function parseMarkdownRecord(source, config) {
  const { metadata, body } = splitFrontMatter(source);
  const record = { ...metadata };

  for (const field of config.textFields) {
    const value = readSection(body, field);
    record[field] = field === config.codeField ? stripCodeFence(value) : value;
  }

  return record;
}

async function readMarkdownCollection(name) {
  const config = collectionConfig[name];
  await ensureDirectory(config.directory);
  const entries = await fs.readdir(config.directory, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'));
  const records = await Promise.all(files.map(async (entry) => {
    const source = await fs.readFile(path.join(config.directory, entry.name), 'utf8');
    return parseMarkdownRecord(source, config);
  }));

  return records.sort((a, b) => {
    const orderDifference = (a.sortOrder ?? Number.MAX_SAFE_INTEGER)
      - (b.sortOrder ?? Number.MAX_SAFE_INTEGER);
    if (orderDifference !== 0) return orderDifference;
    return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
  });
}

async function readMarkdownRecord(name, id) {
  const config = collectionConfig[name];
  try {
    const source = await fs.readFile(recordPath(config.directory, id, 'md'), 'utf8');
    return parseMarkdownRecord(source, config);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function writeMarkdownRecord(name, record) {
  const config = collectionConfig[name];
  assertSafeId(record.id);
  await atomicWrite(
    recordPath(config.directory, record.id, 'md'),
    markdownRecord(record, config),
  );
  return record;
}

async function deleteMarkdownRecord(name, id) {
  const config = collectionConfig[name];
  try {
    await fs.unlink(recordPath(config.directory, id, 'md'));
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function nextSortOrder(name) {
  const records = await readMarkdownCollection(name);
  return records.reduce((maximum, record) => Math.max(maximum, record.sortOrder ?? -1), -1) + 1;
}

export async function initializeStore() {
  await Promise.all([
    ensureDirectory(paths.problems),
    ensureDirectory(paths.adhocProblems),
    ensureDirectory(paths.notes),
    ensureDirectory(paths.daily),
  ]);
}

export async function listRecords(name) {
  return readMarkdownCollection(name);
}

export async function getRecord(name, id) {
  return readMarkdownRecord(name, id);
}

export async function saveRecord(name, record) {
  const existing = await readMarkdownRecord(name, record.id);
  const sortOrder = record.sortOrder ?? existing?.sortOrder ?? await nextSortOrder(name);
  return writeMarkdownRecord(name, { ...record, sortOrder });
}

export async function removeRecord(name, id) {
  return deleteMarkdownRecord(name, id);
}

export async function listDaily() {
  await ensureDirectory(paths.daily);
  const entries = await fs.readdir(paths.daily, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.yaml'));
  const records = await Promise.all(files.map(async (entry) => {
    const source = await fs.readFile(path.join(paths.daily, entry.name), 'utf8');
    return YAML.parse(source);
  }));
  return records.sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

export async function getDaily(id) {
  try {
    const source = await fs.readFile(recordPath(paths.daily, id, 'yaml'), 'utf8');
    return YAML.parse(source);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function saveDaily(record) {
  assertSafeId(record.id);
  await atomicWrite(
    recordPath(paths.daily, record.id, 'yaml'),
    YAML.stringify(record),
  );
  return record;
}

export async function getPreferences() {
  try {
    return YAML.parse(await fs.readFile(paths.preferences, 'utf8')) || {};
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

export async function savePreferences(preferences) {
  await atomicWrite(paths.preferences, YAML.stringify(preferences));
  return preferences;
}

export async function clearGeneratedData() {
  for (const directory of [
    paths.problems,
    paths.adhocProblems,
    paths.notes,
    paths.daily,
  ]) {
    await ensureDirectory(directory);
    const entries = await fs.readdir(directory, { withFileTypes: true });
    await Promise.all(entries
      .filter((entry) => entry.isFile() && /\.(md|yaml)$/.test(entry.name))
      .map((entry) => fs.unlink(path.join(directory, entry.name))));
  }

  await fs.rm(paths.preferences, { force: true });
}
