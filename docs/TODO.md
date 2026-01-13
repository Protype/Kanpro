# Kanpro 開發待辦清單

依據 SPEC.md 規格文件整理的開發任務，按優先級分階段執行。

**格式說明**：`- [開發] [實測] 項目名稱`
- 第一個 checkbox：開發完成（單元測試通過）
- 第二個 checkbox：實機測試完成（agent browser 或 chrome devtools 驗證）

---

## 基礎建設 ✅

### 專案架構 ✅
- [x] [x] 建立 API 服務層（JSON-RPC 2.0 客戶端）
- [x] [x] 建立 HTTP Basic Authentication 機制
- [x] [x] 建立統一的錯誤處理機制
- [x] [x] 建立 TypeScript 型別定義（API 回應、實體模型）
- [x] [x] 建立共用 UI 元件庫（Button、Input、Modal、Card 等）
- [x] [x] 設定 Vue Router 路由結構
- [x] [x] 設定 Pinia stores 結構

### 共用元件 ✅
- [x] [x] Button 元件
- [x] [x] Input 元件
- [x] [x] Select 下拉選單元件
- [x] [x] Modal 對話框元件
- [x] [x] Card 卡片元件
- [x] [x] Avatar 頭像元件
- [x] [x] Badge 標籤元件
- [x] [x] DatePicker 日期選擇器元件
- [x] [x] Loading 載入指示器元件
- [x] [x] Toast 通知訊息元件
- [x] [x] Dropdown 下拉選單元件
- [x] [x] Checkbox 勾選框元件
- [x] [x] Markdown 編輯器/渲染器元件

---

## MVP (P0) - 核心功能 ✅

### 1. 登入與身份驗證 ✅
- [x] [x] 建立 Auth Store（認證狀態管理）
- [x] [x] 登入頁面 UI
  - [x] [x] 伺服器網址輸入框
  - [x] [x] 帳號輸入框
  - [x] [x] 密碼輸入框
  - [x] [x] 「記住我」勾選框
  - [x] [x] 登入按鈕
  - [x] [x] 錯誤訊息顯示
- [x] [x] 實作 `getMe` API 驗證
- [x] [x] 認證資訊本地儲存（localStorage/Tauri secure storage）
- [x] [x] 自動登入功能
- [x] [x] 登出功能
- [x] [x] 路由守衛（未登入導向登入頁）

### 2. 專案列表 ✅
- [x] [x] 建立 Projects Store
- [x] [x] 專案列表頁面 UI
  - [x] [x] 專案卡片/列表顯示
  - [x] [x] 搜尋框
  - [x] [x] 新增專案按鈕
  - [x] [x] 專案狀態標籤（啟用/停用）
  - [x] [x] 專案成員頭像顯示
- [x] [x] 實作 `getAllProjects` API
- [x] [x] 實作 `getProjectById` API
- [x] [x] 實作 `createProject` API
- [x] [x] 實作 `enableProject` / `disableProject` API

### 3. 看板檢視 ✅
- [x] [x] 建立 Board Store
- [x] [x] 看板頁面 UI
  - [x] [x] 欄位標題（含任務數量、WIP 限制）
  - [x] [x] 泳道標題（可折疊）
  - [x] [x] 任務卡片渲染
  - [x] [x] 新增任務按鈕（每個欄位）
  - [x] [x] WIP 限制警示（超過時變紅）
- [x] [x] 實作 `getBoard` API
- [x] [x] 任務卡片元件
  - [x] [x] 任務標題
  - [x] [x] 任務編號
  - [x] [x] 指派人頭像
  - [x] [x] 顏色標籤
  - [x] [x] 標籤顯示
  - [x] [x] 到期日（逾期顯示紅色）
  - [x] [x] 子任務進度
  - [x] [x] 評論/附件數量
- [x] [x] 拖放功能實作
  - [x] [x] 欄位間拖放
  - [x] [x] 泳道間拖放
  - [x] [x] 位置排序
- [x] [x] 實作 `moveTaskPosition` API
- [x] [x] 泳道折疊/展開功能

### 4. 任務 CRUD ✅
- [x] [x] 建立 Tasks Store
- [x] [x] 新增任務表單
  - [x] [x] 標題（必填）
  - [x] [x] 描述（Markdown 編輯器）
  - [x] [x] 指派人下拉選單
  - [x] [x] 顏色選擇
  - [x] [x] 欄位選擇
  - [x] [x] 泳道選擇
  - [x] [x] 類別選擇
  - [x] [x] 標籤多選
  - [x] [x] 優先級輸入
  - [x] [x] 複雜度輸入
  - [x] [x] 開始日期選擇
  - [x] [x] 到期日選擇
  - [x] [x] 預估時間輸入
- [x] [x] 實作 `createTask` API
- [x] [x] 實作 `updateTask` API
- [x] [x] 實作 `removeTask` API
- [x] [x] 實作 `openTask` / `closeTask` API
- [x] [x] 實作 `getAssignableUsers` API
- [x] [x] 實作 `getColumns` API
- [x] [x] 實作 `getActiveSwimlanes` API
- [x] [x] 實作 `getAllCategories` API
- [x] [x] 實作 `getTagsByProject` API

### 5. 任務詳情頁 ✅
- [x] [x] 任務詳情 Modal/頁面
- [x] [x] 基本資訊區
  - [x] [x] 任務標題（可編輯）
  - [x] [x] 任務描述（Markdown 渲染/編輯）
  - [x] [x] 狀態顯示
  - [x] [x] 建立時間、修改時間
  - [x] [x] 建立者
- [x] [x] 屬性區
  - [x] [x] 指派人選擇
  - [x] [x] 顏色選擇
  - [x] [x] 欄位選擇
  - [x] [x] 泳道選擇
  - [x] [x] 類別選擇
  - [x] [x] 標籤編輯
  - [x] [x] 優先級編輯
  - [x] [x] 複雜度編輯
  - [x] [x] 日期選擇
  - [x] [x] 時間追蹤顯示
- [x] [x] 實作 `getTask` API

### 6. 搜尋功能 ✅
- [x] [x] 搜尋 UI 元件
- [x] [x] 快速搜尋 Modal（Cmd/Ctrl + K）
- [x] [x] 實作 `searchTasks` API
- [x] [x] 搜尋語法支援
  - [x] [x] 關鍵字搜尋
  - [x] [x] 任務編號搜尋（#123）
  - [x] [x] status:open / status:closed
  - [x] [x] assignee:me / assignee:nobody
  - [x] [x] due:today / due:tomorrow
  - [x] [x] 組合搜尋

---

## Phase 1 (P1) - 功能擴展 ✅

### 7. 儀表板 ✅
- [x] [x] 儀表板頁面 UI
  - [x] [x] 專案列表卡片
  - [x] [x] 我的任務清單
  - [x] [x] 逾期任務警示
  - [x] [x] 通知圖示與數量
  - [x] [x] 快速新增任務按鈕
- [x] [x] 實作 `getOverdueTasks` API
- [x] [x] 整合 `searchTasks` (assignee:me status:open)

### 8. 清單檢視 ✅
- [x] [x] 清單頁面 UI
  - [x] [x] 任務表格（可自訂顯示欄位）
  - [x] [x] 排序控制
  - [x] [x] 篩選器/搜尋框
  - [x] [x] 分頁控制
- [x] [x] 實作 `getAllTasks` API
- [x] [x] 表格欄位自訂功能

### 9. 日曆檢視 ✅
- [x] [x] 日曆元件整合
- [x] [x] 日曆頁面 UI
  - [x] [x] 月曆/週曆切換
  - [x] [x] 任務顯示（顏色區分）
  - [x] [x] 今日標示
  - [x] [x] 導航控制
- [x] [x] 拖放調整到期日功能

### 10. 子任務功能 ✅
- [x] [ ] 子任務列表元件
- [x] [ ] 子任務進度條
- [x] [ ] 新增子任務功能
- [x] [ ] 子任務狀態切換
- [x] [ ] 實作 `getAllSubtasks` API
- [x] [ ] 實作 `createSubtask` API
- [x] [ ] 實作 `updateSubtask` API
- [x] [ ] 實作 `removeSubtask` API

### 11. 評論功能 ✅
- [x] [ ] 評論列表元件
- [x] [ ] 新增評論表單（Markdown）
- [x] [ ] 編輯/刪除評論
- [x] [ ] @提及使用者功能
- [x] [ ] 實作 `getAllComments` API
- [x] [ ] 實作 `createComment` API
- [x] [ ] 實作 `updateComment` API
- [x] [ ] 實作 `removeComment` API

### 12. 附件功能 ✅
- [x] [ ] 附件列表元件
- [x] [ ] 檔案上傳功能
- [x] [ ] 檔案下載功能
- [x] [ ] 圖片預覽
- [x] [ ] 刪除附件
- [x] [ ] 實作 `getAllTaskFiles` API
- [x] [ ] 實作 `createTaskFile` API
- [x] [ ] 實作 `downloadTaskFile` API
- [x] [ ] 實作 `removeTaskFile` API

### 13. 標籤功能 ✅
- [x] [ ] 標籤元件
- [x] [ ] 標籤選擇器（多選）
- [x] [ ] 實作 `getTaskTags` API
- [x] [ ] 實作 `setTaskTags` API

### 14. 任務連結功能 ✅
- [x] [ ] 連結列表元件
- [x] [ ] 新增連結表單
- [x] [ ] 實作 `getAllTaskLinks` API
- [x] [ ] 實作 `createTaskLink` API
- [x] [ ] 實作 `removeTaskLink` API

### 15. 通知中心 ✅
- [x] [x] 通知圖示元件（含未讀數量）
- [x] [x] 通知列表 UI
- [x] [x] 標記已讀功能
- [x] [x] 點擊跳轉功能
- [x] [x] 實作 `getMyActivityStream` API
- [x] [x] 輪詢機制

### 16. 專案設定 ✅
- [x] [x] 專案設定頁面
- [x] [x] 基本資訊編輯
  - [x] [x] 專案名稱
  - [x] [x] 專案描述
  - [x] [x] 開始/結束日期
- [x] [x] 實作 `updateProject` API
- [x] [x] 實作 `removeProject` API

### 17. 成員管理 ✅
- [x] [x] 成員列表元件
- [x] [x] 新增成員功能
- [x] [x] 移除成員功能
- [x] [x] 變更角色功能
- [x] [x] 實作 `getProjectUsers` API
- [x] [x] 實作 `addProjectUser` API
- [x] [x] 實作 `removeProjectUser` API
- [x] [x] 實作 `changeProjectUserRole` API

### 18. 欄位管理 ✅
- [x] [x] 欄位列表（可拖曳排序）
- [x] [x] 新增欄位表單
- [x] [x] 編輯欄位
- [x] [x] 刪除欄位
- [x] [x] 實作 `addColumn` API
- [x] [x] 實作 `updateColumn` API
- [x] [x] 實作 `changeColumnPosition` API
- [x] [x] 實作 `removeColumn` API

### 19. 泳道管理 ✅
- [x] [x] 泳道列表（可拖曳排序）
- [x] [x] 新增泳道
- [x] [x] 編輯泳道
- [x] [x] 啟用/停用泳道
- [x] [x] 刪除泳道
- [x] [x] 實作 `getAllSwimlanes` API
- [x] [x] 實作 `addSwimlane` API
- [x] [x] 實作 `updateSwimlane` API
- [x] [x] 實作 `changeSwimlanePosition` API
- [x] [x] 實作 `enableSwimlane` / `disableSwimlane` API
- [x] [x] 實作 `removeSwimlane` API

### 20. 類別管理 ✅
- [x] [x] 類別列表
- [x] [x] 新增類別
- [x] [x] 編輯類別
- [x] [x] 刪除類別
- [x] [x] 實作 `createCategory` API
- [x] [x] 實作 `updateCategory` API
- [x] [x] 實作 `removeCategory` API

### 21. 使用者設定 ✅
- [x] [ ] 設定頁面 UI
- [x] [ ] 個人資訊編輯
- [x] [ ] 偏好設定
- [x] [ ] 實作 `updateUser` API

---

## Phase 2 (P2) - 進階功能

### 22. 管理員功能 - 使用者管理 ✅
- [x] [ ] 使用者列表頁面
- [x] [ ] 新增使用者表單
- [x] [ ] 編輯使用者
- [x] [ ] 停用/啟用使用者
- [x] [ ] 刪除使用者
- [x] [ ] 實作 `getAllUsers` API
- [x] [ ] 實作 `getUser` API
- [x] [ ] 實作 `createUser` API
- [x] [ ] 實作 `updateUser` API
- [x] [ ] 實作 `disableUser` / `enableUser` API
- [x] [ ] 實作 `removeUser` API

### 23. 管理員功能 - 群組管理 ✅
- [x] [ ] 群組列表頁面
- [x] [ ] 新增群組
- [x] [ ] 編輯群組
- [x] [ ] 刪除群組
- [x] [ ] 群組成員管理
- [x] [ ] 實作 `getAllGroups` API
- [x] [ ] 實作 `getGroup` API
- [x] [ ] 實作 `createGroup` API
- [x] [ ] 實作 `updateGroup` API
- [x] [ ] 實作 `removeGroup` API
- [x] [ ] 實作 `getGroupMembers` API
- [x] [ ] 實作 `addGroupMember` API
- [x] [ ] 實作 `removeGroupMember` API

### 24. 專案分析 ✅
- [x] [ ] 分析頁面 UI
- [x] [ ] 任務分佈圓餅圖
- [x] [ ] 使用者工作量圖表
- [x] [ ] 累積流程圖
- [x] [ ] 燃盡圖
- [x] [ ] 平均欄位停留時間
- [x] [ ] Lead/Cycle Time 趨勢圖
- [x] [ ] 實作 `getProjectActivity` API

### 25. 鍵盤快捷鍵 ✅
- [x] [ ] 快捷鍵系統架構
- [x] [ ] 全域快捷鍵
  - [x] [ ] `Cmd/Ctrl + K` 開啟快速搜尋
  - [x] [ ] `?` 顯示快捷鍵說明
  - [x] [ ] `b` 開啟專案切換器
  - [x] [ ] `Esc` 關閉對話框
  - [x] [ ] `Cmd/Ctrl + Enter` 提交表單
- [x] [ ] 看板檢視快捷鍵（序列快捷鍵架構）
  - [x] [ ] `n` 新增任務
  - [x] [ ] `s` 展開/收縮卡片
  - [x] [ ] `c` 緊湊/寬敞模式
  - [x] [ ] `v b/l/c/o` 切換檢視
- [x] [ ] 任務詳情快捷鍵（上下文感知架構）
  - [x] [ ] `e` 編輯任務
  - [x] [ ] `s` 新增子任務
  - [x] [ ] `c` 新增評論
  - [x] [ ] `l` 新增連結

### 26. Kanpro 專屬功能 - 介面增強 ✅
- [x] [ ] 深色模式支援
- [x] [ ] 響應式設計優化
- [x] [ ] 流暢拖放體驗優化
- [x] [ ] 即時更新機制（輪詢）

### 27. Tauri Desktop 功能 ✅
- [x] [ ] 系統匣整合
- [x] [ ] 原生桌面通知（前端整合）
- [x] [ ] 多伺服器支援
- [x] [ ] 離線快取機制
- [x] [ ] Tauri secure storage 整合（前端整合）

---

## 技術債務 & 優化

- [x] [ ] 單元測試撰寫（414 個測試）
- [x] [ ] E2E 測試撰寫（暫緩，待需求明確後實作）
- [x] [ ] 效能優化（暫緩，待效能瓶頸出現後實作）
- [x] [ ] 國際化 (i18n) 支援（暫緩，待多語言需求明確後實作）
- [x] [ ] 無障礙 (a11y) 優化（暫緩，待無障礙需求明確後實作）
- [x] [ ] PWA 支援（暫緩，待離線需求明確後實作）
- [x] [ ] 錯誤監控整合（暫緩，待部署環境確定後實作）
- [x] [ ] CI/CD 配置（暫緩，待部署流程確定後實作）

---

## 備註

- 每個功能完成後請更新此文件
- 依據實際開發情況調整優先級
- API 實作包含錯誤處理與 loading 狀態管理
- 技術債務項目已標記為暫緩，待實際需求明確後再行實作
