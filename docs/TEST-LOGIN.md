# 登入功能測試結果

本文件記錄 Kanpro 登入功能的測試結果。

**測試日期**: 2026-01-21
**測試環境**:
- 外掛: KanproBridge v2.0.0
- 認證方式: X-API-Auth header (base64 編碼)
- 前端: Kanpro (Vue 3 + TypeScript)
- 後端: Kanboard + KanproBridge 外掛

---

## API 回應格式

所有 API 回應皆為 JSON-RPC 2.0 格式：

**成功回應**
```json
{"jsonrpc":"2.0","result":{...},"id":1}
```

**錯誤回應**
```json
{"jsonrpc":"2.0","error":{"code":<錯誤代碼>,"message":"<錯誤訊息>"},"id":null}
```

### 錯誤代碼說明

| 代碼 | 說明 | 前端處理 |
|------|------|----------|
| 401 | 認證失敗（帳號或密碼錯誤） | 顯示「帳號或密碼錯誤」 |
| -32600 | 無效請求（header 格式錯誤） | 顯示「認證格式錯誤」 |
| -32601 | 方法不存在（外掛未安裝/JWT 未啟用） | 顯示「外掛未安裝」 |

---

## API 層測試 (curl)

### 登入測試 (getJWTToken)

| # | 測試情境 | 認證內容 | HTTP | error.code | error.message | 結果 |
|---|----------|----------|------|------------|---------------|------|
| 1 | 正確帳號密碼 | `admin:admin` | 200 | - | `access_token` + `refresh_token` | ✅ 成功 |
| 2 | 錯誤帳號 | `nonexistent:admin` | 401 | 401 | `Unauthorized` | ✅ 正確拒絕 |
| 3 | 錯誤密碼 | `admin:wrongpassword` | 401 | 401 | `Unauthorized` | ✅ 正確拒絕 |
| 4 | 空帳號 | `:admin` | 401 | 401 | `Unauthorized` | ✅ 正確拒絕 |
| 5 | 空密碼 | `admin:` | 401 | 401 | `Unauthorized` | ✅ 正確拒絕 |
| 6 | 無效 base64 格式 | `not-valid!!!` | 200 | -32600 | `Invalid X-API-Auth header format...` | ✅ 正確攔截 |
| 7 | base64 但無冒號 | `base64(adminpassword)` | 200 | -32600 | `Invalid X-API-Auth header format...` | ✅ 正確攔截 |

### 外掛檢測測試 (getKanproBridgePlugin)

| # | 測試情境 | HTTP | error.code | 回應內容 | 結果 |
|---|----------|------|------------|----------|------|
| 1 | 正確帳密 | 200 | - | 外掛資訊（name, version, features） | ✅ 成功 |
| 2 | 錯誤帳密 | 401 | 401 | `Unauthorized` | ✅ 正確拒絕 |

---

## 瀏覽器端測試 (Chrome DevTools)

| # | 測試情境 | 前端行為 | 原生對話框 | 錯誤訊息 | 結果 |
|---|----------|----------|------------|----------|------|
| 1 | 空白帳號 | HTML5 驗證攔截 | 無 | 「請填寫這個欄位」 | ✅ 正確 |
| 2 | 空白密碼 | HTML5 驗證攔截 | 無 | 「請填寫這個欄位」 | ✅ 正確 |
| 3 | 錯誤密碼 | API 呼叫失敗 | 無 | 「登入失敗，帳號或密碼錯誤」 | ✅ 正確 |
| 4 | 錯誤帳號 | API 呼叫失敗 | 無 | 「登入失敗，帳號或密碼錯誤」 | ✅ 正確 |
| 5 | 正確帳號密碼 | 登入成功 | 無 | 導向儀表板 | ✅ 成功 |

---

## JWT 未啟用測試

當 KanproBridge 外掛的 JWT Authentication 功能被停用時：

| # | 測試情境 | HTTP | error.code | error.message | 結果 |
|---|----------|------|------------|---------------|------|
| 1 | getKanproBridgePlugin | 200 | -32601 | `Method not found` | ✅ 正確 |
| 2 | getJWTToken | 200 | -32601 | `Method not found` | ✅ 正確 |
| 3 | refreshJWTToken | 200 | -32601 | `Method not found` | ✅ 正確 |
| 4 | 瀏覽器登入 | - | - | 「KanproBridge 外掛未安裝或 JWT 功能未啟用」 | ✅ 正確提示 |

**說明**：當 JWT 功能停用時，所有 JWT 相關的 API 方法都不會被註冊，因此返回 `Method not found`（-32601）。

---

## KanproBridge 外掛未安裝測試

當 KanproBridge 外掛完全未安裝時：

| # | 測試情境 | HTTP | error.code | error.message | 結果 |
|---|----------|------|------------|---------------|------|
| 1 | getKanproBridgePlugin | 200 | -32601 | `Method not found` | ✅ 正確 |
| 2 | getJWTToken | 200 | -32601 | `Method not found` | ✅ 正確 |
| 3 | 瀏覽器登入 | - | - | 「KanproBridge 外掛未安裝或 JWT 功能未啟用」 | ✅ 正確提示 |

**說明**：外掛未安裝時，行為與 JWT 功能停用相同。前端透過 `getKanproBridgePlugin` 方法檢測外掛狀態。

---

## 測試結論

### 已解決的問題

1. **瀏覽器原生認證對話框問題**
   - 使用 `X-API-Auth` header 時，401 回應不會包含 `WWW-Authenticate` header
   - 瀏覽器不會彈出原生認證對話框
   - 錯誤訊息正確顯示在應用程式內

2. **認證安全性**
   - 錯誤帳號、錯誤密碼、空白欄位都會被正確拒絕
   - 無效的 header 格式會被外掛攔截並返回明確錯誤訊息（-32600）

3. **錯誤訊息對應**
   - 認證失敗（401）→「帳號或密碼錯誤」
   - 格式錯誤（-32600）→「認證格式錯誤」
   - 外掛問題（-32601）→「外掛未安裝或 JWT 未啟用」

---

## 相關設定

### Kanboard 伺服器端 (config.php)

```php
define('API_AUTHENTICATION_HEADER', 'X-API-Auth');
```

### 認證 Header 格式

```
X-API-Auth: base64(username:password)
```

範例：
```bash
# admin:admin 的 Base64 編碼為 YWRtaW46YWRtaW4=
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Auth: YWRtaW46YWRtaW4=" \
  -d '{"jsonrpc":"2.0","method":"getJWTToken","id":1}' \
  http://localhost/kanboard/jsonrpc.php
```

---

## 外掛功能狀態

測試時的外掛回應（getKanproBridgePlugin）：

```json
{
  "name": "KanproBridge",
  "version": "2.0.0",
  "description": "Multi-functional bridge plugin...",
  "features": {
    "jwt_auth": {
      "enabled": true,
      "methods": [
        {"name": "getKanproBridgePlugin", "description": "Get plugin info and available methods"},
        {"name": "getJWTToken", "description": "Get access + refresh tokens"},
        {"name": "refreshJWTToken", "description": "Exchange refresh token for new access token"},
        {"name": "revokeJWTToken", "description": "Revoke a specific token"},
        {"name": "revokeUserJWTTokens", "description": "Revoke all tokens for a specific user (admin only)"},
        {"name": "revokeAllJWTTokens", "description": "Revoke all tokens (admin only)"}
      ]
    },
    "user_metadata": {
      "enabled": true,
      "methods": [...]
    }
  }
}
```
