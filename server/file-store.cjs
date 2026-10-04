const fs = require('node:fs');
const path = require('node:path');

const PROBLEM_FIELDS = [
  'id',
  'title',
  'difficulty',
  'status',
  'tags',
  'link',
  'language',
  'code',
  'notes',
  'createdAt',
];

function atomicWrite(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, content, 'utf8');
  fs.renameSync(temporaryPath, filePath);
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows;
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const rows = parseCsv(fs.readFileSync(filePath, 'utf8'));
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1)
    .filter((row) => row.some((value) => value !== ''))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
}

function writeCsv(filePath, rows, fields) {
  const lines = [
    fields.map(csvEscape).join(','),
    ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(',')),
  ];
  atomicWrite(filePath, `${lines.join('\n')}\n`);
}

function encodeScalar(value) {
  if (value === null) return 'z:';
  if (value === undefined) return 'u:';
  if (typeof value === 'boolean') return `b:${value}`;
  if (typeof value === 'number') return `n:${value}`;
  return `s:${encodeURIComponent(String(value))}`;
}

function decodeScalar(value) {
  const type = value.slice(0, 2);
  const payload = value.slice(2);
  if (type === 'z:') return null;
  if (type === 'u:') return undefined;
  if (type === 'b:') return payload === 'true';
  if (type === 'n:') return Number(payload);
  return decodeURIComponent(payload);
}

function flatten(value, segments = [], entries = []) {
  const key = segments.map(encodeURIComponent).join('.');
  if (Array.isArray(value)) {
    entries.push([key, 'a:']);
    value.forEach((item, index) => flatten(item, [...segments, String(index)], entries));
  } else if (value && typeof value === 'object') {
    entries.push([key, 'o:']);
    Object.entries(value).forEach(([name, item]) => flatten(item, [...segments, name], entries));
  } else {
    entries.push([key, encodeScalar(value)]);
  }
  return entries;
}

function setAtPath(root, segments, value) {
  if (segments.length === 0) return value;
  let current = root;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nextIsArrayIndex = /^\d+$/.test(segments[index + 1]);
    if (current[segment] === undefined) current[segment] = nextIsArrayIndex ? [] : {};
    current = current[segment];
  }
  current[segments.at(-1)] = value;
  return root;
}

function unflatten(lines) {
  const records = lines
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=');
      if (separator < 0) return null;
      const key = line.slice(0, separator);
      const value = line.slice(separator + 1);
      const segments = key ? key.split('.').map(decodeURIComponent) : [];
      return { segments, value };
    })
    .filter(Boolean)
    .sort((left, right) => left.segments.length - right.segments.length);

  let root = {};
  for (const record of records) {
    const value = record.value === 'a:'
      ? []
      : record.value === 'o:'
        ? {}
        : decodeScalar(record.value);
    root = setAtPath(root, record.segments, value);
  }
  return root;
}

function serializeFlat(value) {
  return flatten(value).map(([key, item]) => `${key}=${item}`).join('\n');
}

function extractDataBlock(markdown) {
  const match = markdown.match(/<!-- phenomenal-grind-data\n([\s\S]*?)\n-->/);
  return match ? unflatten(match[1].split(/\r?\n/)) : {};
}

function safeFileId(id) {
  const value = String(id);
  if (!/^[A-Za-z0-9._-]+$/.test(value)) {
    throw new Error(`Unsupported record id: ${value}`);
  }
  return value;
}

function markdownSection(title, content) {
  return `## ${title}\n\n${content || ''}\n`;
}

function renderDaily(date, data) {
  const routine = data.routine || {};
  const competitive = data.competitive || {};
  const leetcode = competitive.leetcode || {};
  const codeforces = competitive.codeforces || {};
  const atcoder = competitive.atcoder || {};
  const checklist = Array.isArray(data.checklist) ? data.checklist : [];
  const checklistText = checklist.map((item) => `- [${item.done ? 'x' : ' '}] ${item.text || ''}`).join('\n');

  return [
    `# Daily Journal - ${date}`,
    '',
    '<!-- phenomenal-grind-data',
    serializeFlat(data),
    '-->',
    '',
    `**Mood:** ${routine.mood || ''}`,
    '',
    markdownSection('Highlights', routine.highlights),
    markdownSection('Lowlights', routine.lowlights),
    markdownSection('Gratitude', routine.gratitude),
    markdownSection('Learnings', routine.learnings),
    markdownSection('Journal', routine.body),
    '## Competitive Programming',
    '',
    `- LeetCode: ${leetcode.easy || 0} easy, ${leetcode.medium || 0} medium, ${leetcode.hard || 0} hard`,
    `- Codeforces: ${codeforces.div4 || 0} Div 4, ${codeforces.div3 || 0} Div 3, ${codeforces.div2 || 0} Div 2, ${codeforces.div1 || 0} Div 1`,
    `- AtCoder: ${atcoder.abc || 0} ABC, ${atcoder.arc || 0} ARC, ${atcoder.agc || 0} AGC`,
    '',
    markdownSection('Checklist', checklistText),
  ].join('\n');
}

function extractMarkedSection(markdown, name) {
  const start = `<!-- pg:${name}:start -->`;
  const end = `<!-- pg:${name}:end -->`;
  const startIndex = markdown.indexOf(start);
  const endIndex = markdown.indexOf(end);
  if (startIndex < 0 || endIndex < startIndex) return '';
  return markdown.slice(startIndex + start.length, endIndex).replace(/^\r?\n|\r?\n$/g, '');
}

function renderNote(note) {
  const metadata = { ...note };
  delete metadata.content;
  delete metadata.rough;
  delete metadata.code;

  return [
    `# ${note.title || 'Untitled'}`,
    '',
    '<!-- phenomenal-grind-data',
    serializeFlat(metadata),
    '-->',
    '',
    '<!-- pg:content:start -->',
    note.content || '',
    '<!-- pg:content:end -->',
    '',
    '## Rough Notes',
    '',
    '<!-- pg:rough:start -->',
    note.rough || '',
    '<!-- pg:rough:end -->',
    '',
    `## Code${note.codeLanguage ? ` (${note.codeLanguage})` : ''}`,
    '',
    '<!-- pg:code:start -->',
    note.code || '',
    '<!-- pg:code:end -->',
    '',
  ].join('\n');
}

function normalizeProblem(problem) {
  return {
    ...problem,
    id: String(problem.id),
    tags: Array.isArray(problem.tags) ? problem.tags : [],
  };
}

class FileStore {
  constructor(dataDirectory) {
    this.dataDirectory = dataDirectory;
    this.problemsPath = path.join(dataDirectory, 'problems.csv');
    this.adhocProblemsPath = path.join(dataDirectory, 'adhoc-problems.csv');
    this.preferencesPath = path.join(dataDirectory, 'preferences.ini');
    this.notesDirectory = path.join(dataDirectory, 'notes');
    this.dailyDirectory = path.join(dataDirectory, 'daily');
    fs.mkdirSync(this.notesDirectory, { recursive: true });
    fs.mkdirSync(this.dailyDirectory, { recursive: true });
  }

  readProblems(kind = 'problems') {
    const filePath = kind === 'adhocProblems' ? this.adhocProblemsPath : this.problemsPath;
    return readCsv(filePath).map((problem) => normalizeProblem({
      ...problem,
      tags: problem.tags ? problem.tags.split('|').map((tag) => tag.trim()).filter(Boolean) : [],
    }));
  }

  writeProblems(problems, kind = 'problems') {
    const filePath = kind === 'adhocProblems' ? this.adhocProblemsPath : this.problemsPath;
    const rows = problems.map((problem) => ({
      ...normalizeProblem(problem),
      tags: (problem.tags || []).join(' | '),
    }));
    writeCsv(filePath, rows, PROBLEM_FIELDS);
  }

  listDaily() {
    return fs.readdirSync(this.dailyDirectory)
      .filter((name) => name.endsWith('.md'))
      .sort()
      .map((name) => {
        const id = name.slice(0, -3);
        return { id, ...extractDataBlock(fs.readFileSync(path.join(this.dailyDirectory, name), 'utf8')) };
      });
  }

  getDaily(id) {
    const safeId = safeFileId(id);
    const filePath = path.join(this.dailyDirectory, `${safeId}.md`);
    if (!fs.existsSync(filePath)) return null;
    return { id: safeId, ...extractDataBlock(fs.readFileSync(filePath, 'utf8')) };
  }

  saveDaily(id, data) {
    const safeId = safeFileId(id);
    const payload = { ...data };
    delete payload.id;
    atomicWrite(path.join(this.dailyDirectory, `${safeId}.md`), renderDaily(safeId, payload));
    return { id: safeId, ...payload };
  }

  listNotes() {
    return fs.readdirSync(this.notesDirectory)
      .filter((name) => name.endsWith('.md'))
      .map((name) => {
        const markdown = fs.readFileSync(path.join(this.notesDirectory, name), 'utf8');
        return {
          ...extractDataBlock(markdown),
          content: extractMarkedSection(markdown, 'content'),
          rough: extractMarkedSection(markdown, 'rough'),
          code: extractMarkedSection(markdown, 'code'),
        };
      })
      .sort((left, right) => {
        const order = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
        return order || String(left.createdAt || '').localeCompare(String(right.createdAt || ''));
      });
  }

  saveNote(note) {
    const safeId = safeFileId(note.id);
    const normalized = { ...note, id: safeId };
    atomicWrite(path.join(this.notesDirectory, `${safeId}.md`), renderNote(normalized));
    return normalized;
  }

  deleteNote(id) {
    const filePath = path.join(this.notesDirectory, `${safeFileId(id)}.md`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  getPreferences() {
    if (!fs.existsSync(this.preferencesPath)) return {};
    return unflatten(fs.readFileSync(this.preferencesPath, 'utf8').split(/\r?\n/));
  }

  savePreferences(preferences) {
    const payload = { ...preferences, id: 'user' };
    atomicWrite(
      this.preferencesPath,
      `# Phenomenal Grind preferences\n${serializeFlat(payload)}\n`,
    );
    return payload;
  }

  importLegacy(database) {
    this.writeProblems(database.problems || []);
    this.writeProblems(database.adhocProblems || [], 'adhocProblems');
    for (const daily of database.daily || []) this.saveDaily(daily.id, daily);
    for (const note of database.notes || []) this.saveNote(note);
    this.savePreferences((database.preferences || [])[0] || {});
  }
}

module.exports = { FileStore };
