# Kanpro

Kanboard 前端介面重新實作專案，提供更好的使用體驗。

## 技術棧

- Vue 3 + TypeScript + Composition API
- Vite
- Tailwind CSS v4
- Pinia
- Vue Router
- Tauri 2（Desktop 版本）

## 開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 執行測試
npm run test

# 建構
npm run build
```

## 部署設定

### API URL 配置

建構後透過 `config.json` 設定 Kanboard 伺服器網址：

```bash
# 複製範例設定檔
cp dist/config.example.json dist/config.json

# 編輯 config.json，設定 API URL
```

**config.json 格式：**

```json
{
  "apiUrl": "http://your-kanboard-server/kanboard"
}
```

**配置優先級：**

1. `config.json`（最高）：有設定時鎖定不可更改
2. `localStorage`：使用者手動輸入的網址（僅在 config.json 無值時使用）

**URL 格式：**

- 支援相對路徑：`/kanboard/`
- 支援完整 URL：`http://your-server/kanboard`
- 不需包含 `jsonrpc.php`，系統會自動補上

### CORS 設定

如果 Kanpro 與 Kanboard 部署在不同網域，需要在 Kanboard 伺服器啟用 CORS。

可使用 [kanboard-plugin-api-cors](https://github.com/nickvidal/kanboard-plugin-api-cors) 插件。

## 測試資料產生器

提供 seeder 腳本產生測試資料：

```bash
# 產生測試資料
npm run seed -- --url http://your-kanboard/jsonrpc.php --user admin --pass admin

# 清除測試資料
npm run seed:clean -- --url http://your-kanboard/jsonrpc.php --user admin --pass admin
```

## 授權

MIT
