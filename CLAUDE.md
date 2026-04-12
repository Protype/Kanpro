# CLAUDE.md

必須使用繁體中文 (zh-tw) 進行溝通。

## 專案概述

Kanpro — Kanboard 前端 SPA，透過 JSON-RPC 2.0 API 串接 Kanboard 服務。
技術棧：Vue 3 + TypeScript + Vite + Tailwind CSS v4 + Pinia + Vue Router + Tauri 2。

## 重要文件

- @docs/SPEC.md — 功能規格
- @docs/TDD.md — TDD 開發規範
- @docs/TODO.md — 待辦任務
- `LOCAL.md` — 本地測試環境連線資訊（不進版控）

## 立即執行

1. 確認 port:3000 是否有殘留的開發伺服器，有的話先關閉
2. 啟動本地開發伺服器
3. 確認 GitHub issue / PR，向我確認是否繼續未完成的任務

## 開發流程

1. 建立 gh issue（功能名稱、說明、測試項目）
2. 建立開發分支 `feat/issue-{id}`
3. TDD 開發：紅燈 → 綠燈 → 重構
4. 頻繁 commit，使用語意化格式 `feat(ui): 說明`
5. 實機測試（瀏覽器用 Playwright MCP，API 用 curl），連線資訊見 LOCAL.md
6. 建立 PR，詳細說明變動
7. Code review → 合併 → 檢查版本號
8. 依 TODO.md 向我確認下一個任務

## 注意事項

- 實機測試須涵蓋不同權限（admin / manager / user）
- 可自行在測試 Kanboard 環境建立測試帳號、群組、專案
- `build.sh` 為正式主機環境專用的部署腳本（已 gitignore），**修改前必須先向我確認**
- Kanboard API：JSON-RPC 2.0，端點 `/jsonrpc.php`，支援 API Token 或帳密認證
