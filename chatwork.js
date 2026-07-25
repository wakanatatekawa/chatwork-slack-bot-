const BASE_URL = 'https://api.chatwork.com/v2';

function authHeaders() {
  const token = process.env.CHATWORK_API_TOKEN;
  if (!token) {
    throw new Error('CHATWORK_API_TOKEN is not set');
  }
  return { 'X-ChatWorkToken': token };
}

async function chatworkGet(path) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(`ChatWork API error ${res.status} on ${path}: ${await res.text()}`);
  }
  return res.json();
}

function getMe() {
  return chatworkGet('/me');
}

function getRooms() {
  return chatworkGet('/rooms');
}

// force=1: 既読状態に関わらず常に最新のメッセージ(最大100件)を返す。
// 自前でstate管理して重複通知を防ぐため、force=0のAPI側read pointerには依存しない。
function getRoomMessages(roomId) {
  return chatworkGet(`/rooms/${roomId}/messages?force=1`);
}

module.exports = { getMe, getRooms, getRoomMessages };
