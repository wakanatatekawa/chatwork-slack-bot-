const { WebClient } = require('@slack/web-api');

function getClient() {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error('SLACK_BOT_TOKEN is not set');
  }
  return new WebClient(token);
}

async function postUnrepliedMention({ roomName, roomId, senderName, messageId, sendTime, excerpt }) {
  const client = getClient();
  const channel = process.env.SLACK_CHANNEL_ID;
  if (!channel) {
    throw new Error('SLACK_CHANNEL_ID is not set');
  }

  const link = `https://www.chatwork.com/#!rid${roomId}-${messageId}`;
  const sentAt = new Date(sendTime * 1000).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

  await client.chat.postMessage({
    channel,
    text: `[${roomName}] ${senderName}さんからのメンションに返信もれがあります (${sentAt})`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            ':warning: *返信もれを検知しました*',
            `*ルーム:* ${roomName}`,
            `*送信者:* ${senderName}`,
            `*送信日時:* ${sentAt}`,
            `*内容:* ${excerpt || '(本文なし)'}`,
            `<${link}|ChatWorkで開く>`,
          ].join('\n'),
        },
      },
    ],
  });
}

module.exports = { postUnrepliedMention };
