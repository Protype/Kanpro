# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 語言規範

- 請使用繁體中文 (zh-tw) 進行溝通

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

## 常用指令

```bash
npm run dev          # 啟動開發伺服器 (http://localhost:3000)
npm run build        # 建構生產版本
npm run preview      # 預覽生產版本
npm run tauri:dev    # 啟動 Tauri 開發模式
npm run tauri:build  # 建構 Desktop 應用
```

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
