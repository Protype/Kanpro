# CLAUDE.md

本檔案為 Claude Code (claude.ai/code) 在此代碼庫中工作時提供指導。

必須使用繁體中文 (zh-tw) 進行溝通。

## 專案概述

Kanpro 是開源專案管理軟體 Kanboard 的前端介面軟體化實作專案，旨在提供更佳的使用體驗，
除沿襲 Kanboard 的核心精神，亦遵循 Kanban / Scrum 等敏捷開發方法論規劃與設計。
採用 Vue 3 + TypeScript 進行開發，後面串接 Kanboard 的 API 服務。

- **目標**：改善 Kanboard 過於簡陋的原生介面，提供更好的使用體驗
- **架構**：純前端 SPA，透過 JSON-RPC 2.0 API 存取 Kanboard 服務
- **部署形式**：Web App 與 Tauri Desktop Client

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

## 重要文件

請完整閱讀以下文件

- @docs/SPEC.md # 開發規格文件
- @docs/TDD.md # 測試驅動開發文件
- @docs/TODO.md # 待辦開發任務文件

## 立即執行

- 確認是否有之前殘留的開發伺服器，如果有的話先關閉
- 啟動本地開發伺服器
- 確認 github issue / github PR ，確認是否有未完成的開發項目或任務，並向我確認是否進行

## 重要說明

- 所有基於瀏覽器的實機測試，應使用 agent-browser 或  chrome-dev-tool 等工具進行
- 所有 API 端點的連線測試，必須使用諸如 curl 等工具進行
- 你可以（也應該）自行在目前測試用的 Kanboard 環境中，建立測試用的使用者帳號、群組和專案，以便進行完整測試，包含不同權限上的測試

### 開發方式

每個功能項目必須依據以下流程規則，按照 TDD 測試驅動規範進行開發

1. 開發之前，針對此次要開發的功能項目，建立完整的 gh issue，包含但不限於 功能名稱、內容說明、詳細的測試項目
2. 在 issue 建立後，先 git branch 建立對應的開發分支，使用如 `feat/issue-{id}` 的命名格式進行撰寫
3. 測試先行，進行 TDD 開發流程，從紅燈開始
4. 你應該頻繁交付檔案變動，並詳細紀錄，git commit 必須使用如 `feat(ui): 說明` 這樣的語意化格式進行撰寫
5. 開發完畢，一定要使用如 agent-browser, chrome-dev-tool 等工具進行實機測試，確保功能正常，測試時如需使用目前網站和 API 連線資訊，可參考 LOCAL.md
6. 實機測試完畢，必須對應 issue 建立完整的 PR，並使用如 `feat(ui): 說明` 這樣的語意化格式進行撰寫，在 PR 中針對程式碼的變動進行詳細說明
7. 當實機測試完畢完畢，PR 建立後，你應該進行 code review，並嘗試合併至 main branch
8. 檢查是否需要更新版本號，並依據語意化版本規範進行更新
9. 依據 @docs/TODO.md，向我確認並繼續進行下一個開發任務

## 本地開發設定

本地測試環境的連線資訊（API 位置、測試帳號密碼）存放於 `LOCAL.md`（不進入版本控制）。

## Kanboard API

Kanboard 使用 JSON-RPC 2.0 協議，端點為 `/jsonrpc.php`，支援兩種認證方式：
1. API Token（使用 `jsonrpc` 帳號 + token）
2. 使用者帳密或個人存取 token
