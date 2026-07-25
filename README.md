# chatwork-slack-bot

ChatWorkで**自分宛てのメンションのうち、まだ返信していないもの**を検知してSlackに通知するBotです。

- 自分がメンションされたメッセージのうち、そのメンション**以降にそのルームで自分が何かしら発言（テキスト・スタンプ問わず）していれば「返信済み」とみなして通知しません**。
- 通知していないもの（未返信）だけをSlackに投稿します。
- 一度通知したメンションは重複通知しません（`data/state.json` に通知済みIDを保存）。

## 動作の仕組み

1. ChatWork API (`GET /rooms`, `GET /rooms/{room_id}/messages`) で参加中の全ルームの最新メッセージを取得
2. 自分の `account_id` が `[To:xxx]` の形でメンションされているメッセージを抽出
3. そのメッセージの送信時刻より後に、自分からの発言がルーム内にあるかを確認
   - あれば「返信済み」→ 何もしない
   - なければ「未返信」→ Slackに通知
4. 通知したメッセージIDを `data/state.json` に記録し、次回以降は重複通知しない

## セットアップ

### 1. ChatWork APIトークンを発行する

ChatWork管理画面 → 「API連携」→「トークン発行」から取得します。

**注意:** APIトークンは強力な認証情報です。コードに直接書いたり、チャットやSlackに平文で貼り付けたりしないでください。万が一貼り付けてしまった場合は、そのトークンを無効化し再発行してください。

### 2. Slack Appを作成する

1. https://api.slack.com/apps → **Create New App** → **From scratch**
2. アプリ名（例: `ChatWork返信もれ通知`）とワークスペースを選択
3. 左メニュー **OAuth & Permissions** を開く
4. **Scopes > Bot Token Scopes** に以下を追加
   - `chat:write`
5. ページ上部の **Install to Workspace** を実行し、**Bot User OAuth Token**（`xoxb-`から始まる）を控える
6. 通知先にしたいSlackチャンネルにBotを招待（チャンネルで `/invite @アプリ名`）
7. 通知先チャンネルのチャンネルID（チャンネル名を右クリック→「チャンネル詳細を表示」の一番下にあるID）を控える

### 3. GitHub Secretsを登録する（GitHub Actionsで動かす場合）

このリポジトリの **Settings > Secrets and variables > Actions** で以下を登録します。

| Secret名 | 値 |
|---|---|
| `CHATWORK_API_TOKEN` | 手順1で発行したトークン |
| `SLACK_BOT_TOKEN` | 手順2で控えた `xoxb-...` |
| `SLACK_CHANNEL_ID` | 手順2で控えたチャンネルID |

登録後、`.github/workflows/check-mentions.yml` により**10分ごとに自動チェック**が走ります（GitHub Actionsの仕様上、実際の実行間隔は多少前後することがあります）。手動で今すぐ実行したい場合は、リポジトリの **Actions** タブ → **Check ChatWork unreplied mentions** → **Run workflow** から実行できます。

### 4. ローカルで試す場合

```bash
npm install
cp .env.example .env
# .env に CHATWORK_API_TOKEN / SLACK_BOT_TOKEN / SLACK_CHANNEL_ID を設定

# 1回だけチェックして終了
npm run check

# 常駐プロセスとして一定間隔でチェックし続ける（Railway/Render等で常時起動する場合）
npm start
```

## 既知の制限（v1）

- メンション検知後の「返信」は、同じルームで自分が送った**任意のメッセージ**を指します。厳密にそのメンションへの返信かどうかまでは判定していません（ChatWorkの返信引用機能を使っていなくても、スタンプ含め何か発言すれば「返信済み」扱いになります）。
- 1ルームあたり直近100件のメッセージのみを見るため、非常に発言頻度の高いルームでは古いメンションが取得範囲から外れる可能性があります。
- `LOOKBACK_HOURS`（デフォルト24時間）より古いメンションは、そもそも通知対象として見ません。
