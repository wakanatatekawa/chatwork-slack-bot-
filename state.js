const fs = require('fs');
const path = require('path');

function statePath() {
  return process.env.STATE_FILE_PATH || path.join(__dirname, '..', 'data', 'state.json');
}

function loadState() {
  try {
    const raw = fs.readFileSync(statePath(), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { notifiedMessageIds: [] };
  }
}

function saveState(state) {
  const filePath = statePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

module.exports = { loadState, saveState };
