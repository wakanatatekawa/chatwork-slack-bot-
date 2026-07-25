require('dotenv').config();
const cron = require('node-cron');
const { runCheck } = require('./detect');

async function main() {
  const once = process.argv.includes('--once');

  if (once) {
    await runCheck();
    return;
  }

  const intervalMinutes = Number(process.env.POLL_INTERVAL_MINUTES || 10);
  console.log(`ChatWork返信もれ通知Botを起動しました（${intervalMinutes}分間隔でチェックします）`);

  await runCheck();
  cron.schedule(`*/${intervalMinutes} * * * *`, () => {
    runCheck().catch((err) => console.error('チェック中にエラーが発生しました:', err));
  });
}

main().catch((err) => {
  console.error('起動に失敗しました:', err);
  process.exit(1);
});
