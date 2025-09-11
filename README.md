# 台灣股市監控服務

一個自動化的股市監控系統，透過 LINE Bot 發送即時警報。

## 功能特色

- 24/7 自動監控台灣股市
- 支援多種警報條件（恐慌性賣壓、慢性失血、ETF 超賣等）
- 透過 LINE Bot 即時推送警報
- 部署在 Vercel 雲端平台

## 本地開發

**前置需求:** Node.js 18+

1. 安裝依賴項：
   ```bash
   npm install
   ```

2. 設定環境變數：
   ```bash
   cp .env.example .env.local
   ```
   編輯 `.env.local` 並填入必要的 API 金鑰

3. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

## Vercel 部署

1. 將專案推送到 GitHub
2. 在 Vercel 中匯入專案
3. 設定環境變數：
   - `CHANNEL_ACCESS_TOKEN`: LINE Bot Channel Access Token
   - `USER_ID`: 接收警報的 LINE 用戶 ID
   - `CRON_SECRET`: Cron Job 安全金鑰
4. 啟用 Vercel KV 資料庫
5. 部署完成

## 環境變數設定

請參考 `.env.example` 文件了解所需的環境變數。
