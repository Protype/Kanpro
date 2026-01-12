# CLAUDE.md

本檔案為 Claude Code (claude.ai/code) 在此代碼庫中工作時提供指導。

## 語言規範

- 使用繁體中文 (zh-tw) 進行溝通

## 重要文件

請完整閱讀以下文件

- @docs/SPEC.md # 開發規格文件
- @docs/TDD.md # 測試驅動開發文件

## 重要測試說明

- 所有介面相關的開發項目，最終必須使用 chrome devtool 進行實機測試，目前網站和 API 連線資訊需依據 .env.local 進行設定
- 所有 API 端點的連線測試，必須使用諸如 curl 等工具進行
- 你可以（也應該）自行在目前測試用的 Kanboard 環境中，建立測試用的使用者帳號、群組和專案，以便進行完整測試，包含不同權限上的測試

### 開發方式

每個功能項目必須依據以下流程規則，按照 TDD 測試驅動規範進行開發

1. 開發之前，針對此次要開發的功能項目，建立完整的 gh issue，包含但不限於 功能名稱、內容說明、詳細的測試項目
2. 在 issue 建立後，先 git branch 建立對應的開發分支，使用如 `feat/issue-{id}` 的命名格式進行撰寫
3. 測試先行，進行 TDD 開發流程，從紅燈開始
4. 你應該頻繁交付檔案變動，並詳細紀錄，git commit 必須使用如 `feat(ui): 說明` 這樣的語意化格式進行撰寫
5. 開發完畢，必須對應 issue 建立完整的 PR，使用如 `feat(ui): 說明` 這樣的語意化格式進行撰寫，並在 PR 中針對程式碼的變動進行詳細說明

### 自動化強化開發方式

當處於自動化強化開發模式時，請追加以下流程規則

1. 系統啟動後，你應該檢查 github issue / github PR ，確認是否有未完成的開發項目或任務，並接手繼續進行
2. 當開發完畢，PR 建立後，你應該進行 code review，並嘗試合併至 main branch
3. 當合併完成後，你應該依據 @docs/TODO.md ，繼續進行下一個開發任務

## 專案概述

Kanpro 是 Kanboard 的前端介面重新實作專案。

- **目標**：改善 Kanboard 過於簡陋的原生介面，提供更好的使用體驗
- **架構**：純前端 SPA，透過 JSON-RPC 2.0 API 存取 Kanboard 服務
- **部署形式**：Web App 或 Tauri Desktop Client

## 技術棧

- **前端框架**：Vue 3 + TypeScript + Composition API
- **建構工具**：Vite
- **樣式**：Tailwind CSS v4
- **狀態管理**：Pinia
- **路由**：Vue Router
- **Desktop 封裝**：Tauri 2

## 專案結構

```
src/
├── views/           # 頁面元件
├── stores/          # Pinia stores
├── router/          # Vue Router 設定
├── styles/          # 全域樣式
src-tauri/           # Tauri (Rust) 原生程式碼
```

## 本地開發設定

本地端設定資訊存放於 `.env.local`（不進入版本控制），請參考 `.env.example` 建立。

## Kanboard API

Kanboard 使用 JSON-RPC 2.0 協議，端點為 `/jsonrpc.php`，支援兩種認證方式：
1. API Token（使用 `jsonrpc` 帳號 + token）
2. 使用者帳密或個人存取 token
