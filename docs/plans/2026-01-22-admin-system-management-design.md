# 系統管理功能設計文件

## 概述

新增系統管理功能，讓管理員可以查看系統狀態、調整設定、管理使用者與群組。

## 變更範圍

### 1. API 方法更名

將 `getKanproBridgePlugin` 更名為 `getKanproBridgeStatus`：
- `src/services/api/jwt.ts`

### 2. 路由結構

```
/admin                → 系統狀態（預設）
/admin/settings       → 系統設定
/admin/users          → 使用者管理（已存在，整合）
/admin/groups         → 群組管理（已存在，整合）
```

所有 `/admin/*` 路由加入 `meta: { requiresAdmin: true }`。

### 3. Header 導航

當進入 `/admin/*` 路由時，AppHeader 顯示分頁導航：

```
⚙️ 系統管理  ›  [系統狀態] [系統設定] [使用者管理] [群組管理]
```

與專案頁面相同的 topbar 分頁樣式。

### 4. UserDropdown 變更

在「個人設定」與「樣板風格」之間加入「系統管理」選項，僅 `app-admin` 角色可見。

## 頁面設計

### 系統狀態頁面 (`/admin`)

左右雙欄佈局：

**左側 - Kanboard 伺服器**
- 版本（`getVersion`）
- 時區（`getTimezone`）
- API 位址
- 連線狀態（含延遲 ms）

**右側 - KanproBridge 外掛**
- 版本
- 模組狀態列表：
  - JWT 認證 → 登入驗證、Token 管理
  - 使用者頭像 → 頭像上傳與顯示
  - 使用者元資料 → 偏好設定儲存
  - 密碼管理 → 密碼變更功能
  - 使用者設定檔 → 個人資料編輯

**狀態指示**
- `●` 綠色燈號 + 正常文字 = 已啟用
- `○` 灰色燈號 + 淡色文字 = 未啟用

**響應式**
- 桌面：左右並排
- 手機：上下堆疊（系統在上，外掛在下）

### 系統設定頁面 (`/admin/settings`)

**連線設定**
- API 位址（若由 config.json 鎖定則顯示為唯讀）
- 測試連線按鈕

**介面設定**
- 自動刷新間隔（下拉選單）
- 啟用桌面通知（checkbox）

**Kanboard 設定（暫時保留）**
- 淡色/虛線框區塊
- 說明文字：此區域將顯示可透過 KanproBridge 讀取/修改的伺服器設定

**儲存位置**
- 連線設定、介面設定 → localStorage
- 未來 Kanboard 設定 → KanproBridge API

### 使用者管理頁面 (`/admin/users`)

整合現有 `UsersManagementView.vue`，移除獨立頁面的 header 元素。

### 群組管理頁面 (`/admin/groups`)

整合現有 `GroupsManagementView.vue`，移除獨立頁面的 header 元素。

## 權限控制

### UserDropdown
```typescript
const isAdmin = computed(() => authStore.user?.role === 'app-admin')
```

### 路由守衛
```typescript
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAdmin) {
    const authStore = useAuthStore()
    if (authStore.user?.role !== 'app-admin') {
      return next({ name: 'all-tasks' })
    }
  }
  next()
})
```

## 檔案變更清單

### 新增
- `src/views/AdminStatusView.vue` - 系統狀態頁面
- `src/views/AdminSettingsView.vue` - 系統設定頁面
- `src/stores/system.ts` - 系統狀態 store

### 修改
- `src/services/api/jwt.ts` - API 方法更名
- `src/stores/auth.ts` - 對應 API 更名
- `src/router/index.ts` - 新增 admin 路由與守衛
- `src/components/header/AppHeader.vue` - 新增 admin 導航
- `src/components/header/UserDropdown.vue` - 新增系統管理選項
- `src/views/UsersManagementView.vue` - 移除獨立 header
- `src/views/GroupsManagementView.vue` - 移除獨立 header

## KanproBridge API 對應

| 模組 | API 方法 | Kanpro 功能 |
|------|----------|-------------|
| 核心 | `getKanproBridgeStatus` | 外掛狀態檢查 |
| JWT | `getJWTToken`, `refreshJWTToken`, `revokeJWTToken` | 登入、Session 管理 |
| 頭像 | `uploadUserAvatar`, `getUserAvatar`, `removeUserAvatar` | 個人頭像 |
| 元資料 | `getUserMetadata`, `saveUserMetadata`, `removeUserMetadata` | 偏好設定 |
| 密碼 | `changeUserPassword`, `resetUserPassword` | 密碼變更 |
| 設定檔 | `getUserProfile`, `updateUserProfile` | 個人資料編輯 |
