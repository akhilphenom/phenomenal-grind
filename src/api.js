const API = '/api';

// ─── Problems (not day-wise) ───
export async function fetchProblems() {
  const res = await fetch(`${API}/problems`);
  return res.json();
}

export async function updateProblem(problem) {
  const res = await fetch(`${API}/problems/${problem.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(problem),
  });
  return res.json();
}

export async function addProblem(problem) {
  const res = await fetch(`${API}/problems`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(problem),
  });
  return res.json();
}

export async function deleteProblem(id) {
  await fetch(`${API}/problems/${id}`, { method: 'DELETE' });
}

// ─── Daily data (day-wise, id = date string like "2026-05-31") ───
export async function fetchAllDaily() {
  const res = await fetch(`${API}/daily`);
  const arr = await res.json();
  // Convert array to { [date]: data } map
  const map = {};
  for (const entry of arr) {
    const { id, ...rest } = entry;
    map[id] = rest;
  }
  return map;
}

export async function fetchDaily(dateKey) {
  const res = await fetch(`${API}/daily/${dateKey}`);
  if (res.status === 404) return null;
  const { id, ...rest } = await res.json();
  return rest;
}

export async function saveDaily(dateKey, data) {
  // Try PUT first (update), if 404 then POST (create)
  const payload = { id: dateKey, ...data };
  let res = await fetch(`${API}/daily/${dateKey}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 404) {
    res = await fetch(`${API}/daily`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
  return res.json();
}

// ─── Notes (not day-wise, tree structure) ───
export async function fetchNotes() {
  const res = await fetch(`${API}/notes`);
  return res.json();
}

export async function addNote(note) {
  const res = await fetch(`${API}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  return res.json();
}

export async function updateNote(note) {
  const res = await fetch(`${API}/notes/${note.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  return res.json();
}

export async function deleteNote(id) {
  await fetch(`${API}/notes/${id}`, { method: 'DELETE' });
}
