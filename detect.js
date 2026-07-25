const { getMe, getRooms, getRoomMessages } = require('./chatwork');
const { postUnrepliedMention } = require('./slack');
const { loadState, saveState } = require('./state');

const LOOKBACK_HOURS = Number(process.env.LOOKBACK_HOURS || 24);

// メンション "[To:123]名前さん" や返信引用 "[rp aid=... to=...]...[/rp]" を除いた本文を作る
function excerpt(body, max = 100) {
  if (!body) return '';
  const cleaned = body
    .replace(/\[To:\d+\]\s*[^\n]*\n?/g, '')
    .replace(/\[rp aid=\d+ to=\d+-\d+\][^[]*\[\/rp\]\s*/g, '')
    .trim();
  return cleaned.length > max ? `${cleaned.slice(0, max)}...` : cleaned;
}

async function runCheck() {
  const me = await getMe();
  const myAccountId = me.account_id;
  const rooms = await getRooms();

  const state = loadState();
  const notified = new Set((state.notifiedMessageIds || []).map(String));

  const nowSeconds = Math.floor(Date.now() / 1000);
  const lookbackSeconds = LOOKBACK_HOURS * 3600;

  for (const room of rooms) {
    let messages;
    try {
      messages = await getRoomMessages(room.room_id);
    } catch (err) {
      console.error(`[${room.name}] メッセージ取得に失敗しました: ${err.message}`);
      continue;
    }
    if (!Array.isArray(messages) || messages.length === 0) continue;

    // このルームで自分が最後に何かしら発言した時刻（テキスト・スタンプ問わず）
    const myReplyTimes = messages
      .filter((m) => m.account && m.account.account_id === myAccountId)
      .map((m) => m.send_time);
    const myLatestReplyTime = myReplyTimes.length > 0 ? Math.max(...myReplyTimes) : 0;

    for (const message of messages) {
      if (!message.account || message.account.account_id === myAccountId) continue;
      if (!message.body || !message.body.includes(`[To:${myAccountId}]`)) continue;
      if (nowSeconds - message.send_time > lookbackSeconds) continue;

      const messageId = String(message.message_id);
      if (notified.has(messageId)) continue;

      // メンション以降に自分の発言（スタンプ含む）があれば返信済みとみなして除外
      const alreadyReplied = myLatestReplyTime > message.send_time;
      if (alreadyReplied) continue;

      await postUnrepliedMention({
        roomName: room.name,
        roomId: room.room_id,
        senderName: message.account.name,
        messageId: message.message_id,
        sendTime: message.send_time,
        excerpt: excerpt(message.body),
      });

      notified.add(messageId);
      console.log(`[${room.name}] ${message.account.name}さんのメンション(未返信)を通知しました (message_id=${messageId})`);
    }
  }

  state.notifiedMessageIds = Array.from(notified);
  saveState(state);
}

module.exports = { runCheck, excerpt };
