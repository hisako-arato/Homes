// セーブ（端末の localStorage。章の区切りごとに書く）
const KEY = 'homes-save-v1';
export const S = { step: 'intro', clues: [], examined: [], answers: {}, persons: [] };
export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch (_) { return false; }
}
export function load() {
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (_) { /* noop */ }
  return S;
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { /* noop */ }
}
export function reset() {
  Object.assign(S, { step: 'intro', clues: [], examined: [], answers: {}, persons: [] });
  try { localStorage.removeItem(KEY); } catch (_) { /* noop */ }
}
export const addClue = id => { if (!S.clues.includes(id)) { S.clues.push(id); save(); return true; } return false; };
export const addPerson = id => { if (!S.persons.includes(id)) { S.persons.push(id); save(); } };
