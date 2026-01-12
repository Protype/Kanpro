# Kanpro 開發待辦清單

依據 SPEC.md 規格文件整理的開發任務，按優先級分階段執行。

---

## 基礎建設

### 專案架構
- [ ] 建立 API 服務層（JSON-RPC 2.0 客戶端）
- [ ] 建立 HTTP Basic Authentication 機制
- [ ] 建立統一的錯誤處理機制
- [ ] 建立 TypeScript 型別定義（API 回應、實體模型）
- [ ] 建立共用 UI 元件庫（Button、Input、Modal、Card 等）
- [ ] 設定 Vue Router 路由結構
- [ ] 設定 Pinia stores 結構

### 共用元件
- [ ] Button 元件
- [ ] Input 元件
- [ ] Select 下拉選單元件
- [ ] Modal 對話框元件
- [ ] Card 卡片元件
- [ ] Avatar 頭像元件
- [ ] Badge 標籤元件
- [ ] DatePicker 日期選擇器元件
- [ ] Loading 載入指示器元件
- [ ] Toast 通知訊息元件
- [ ] Dropdown 下拉選單元件
- [ ] Checkbox 勾選框元件
- [ ] Markdown 編輯器/渲染器元件

---

## MVP (P0) - 核心功能

### 1. 登入與身份驗證
- [ ] 建立 Auth Store（認證狀態管理）
- [ ] 登入頁面 UI
  - [ ] 伺服器網址輸入框
  - [ ] 帳號輸入框
  - [ ] 密碼輸入框
  - [ ] 「記住我」勾選框
  - [ ] 登入按鈕
  - [ ] 錯誤訊息顯示
- [ ] 實作 `getMe` API 驗證
- [ ] 認證資訊本地儲存（localStorage/Tauri secure storage）
- [ ] 自動登入功能
- [ ] 登出功能
- [ ] 路由守衛（未登入導向登入頁）

### 2. 專案列表
- [ ] 建立 Projects Store
- [ ] 專案列表頁面 UI
  - [ ] 專案卡片/列表顯示
  - [ ] 搜尋框
  - [ ] 新增專案按鈕
  - [ ] 專案狀態標籤（啟用/停用）
  - [ ] 專案成員頭像顯示
- [ ] 實作 `getAllProjects` API
- [ ] 實作 `getProjectById` API
- [ ] 實作 `createProject` API
- [ ] 實作 `enableProject` / `disableProject` API

### 3. 看板檢視
- [ ] 建立 Board Store
- [ ] 看板頁面 UI
  - [ ] 欄位標題（含任務數量、WIP 限制）
  - [ ] 泳道標題（可折疊）
  - [ ] 任務卡片渲染
  - [ ] 新增任務按鈕（每個欄位）
  - [ ] WIP 限制警示（超過時變紅）
- [ ] 實作 `getBoard` API
- [ ] 任務卡片元件
  - [ ] 任務標題
  - [ ] 任務編號
  - [ ] 指派人頭像
  - [ ] 顏色標籤
  - [ ] 標籤顯示
  - [ ] 到期日（逾期顯示紅色）
  - [ ] 子任務進度
  - [ ] 評論/附件數量
- [ ] 拖放功能實作
  - [ ] 欄位間拖放
  - [ ] 泳道間拖放
  - [ ] 位置排序
- [ ] 實作 `moveTaskPosition` API
- [ ] 泳道折疊/展開功能

### 4. 任務 CRUD
- [ ] 建立 Tasks Store
- [ ] 新增任務表單
  - [ ] 標題（必填）
  - [ ] 描述（Markdown 編輯器）
  - [ ] 指派人下拉選單
  - [ ] 顏色選擇
  - [ ] 欄位選擇
  - [ ] 泳道選擇
  - [ ] 類別選擇
  - [ ] 標籤多選
  - [ ] 優先級輸入
  - [ ] 複雜度輸入
  - [ ] 開始日期選擇
  - [ ] 到期日選擇
  - [ ] 預估時間輸入
- [ ] 實作 `createTask` API
- [ ] 實作 `updateTask` API
- [ ] 實作 `removeTask` API
- [ ] 實作 `openTask` / `closeTask` API
- [ ] 實作 `getAssignableUsers` API
- [ ] 實作 `getColumns` API
- [ ] 實作 `getActiveSwimlanes` API
- [ ] 實作 `getAllCategories` API
- [ ] 實作 `getTagsByProject` API

### 5. 任務詳情頁
- [ ] 任務詳情 Modal/頁面
- [ ] 基本資訊區
  - [ ] 任務標題（可編輯）
  - [ ] 任務描述（Markdown 渲染/編輯）
  - [ ] 狀態顯示
  - [ ] 建立時間、修改時間
  - [ ] 建立者
- [ ] 屬性區
  - [ ] 指派人選擇
  - [ ] 顏色選擇
  - [ ] 欄位選擇
  - [ ] 泳道選擇
  - [ ] 類別選擇
  - [ ] 標籤編輯
  - [ ] 優先級編輯
  - [ ] 複雜度編輯
  - [ ] 日期選擇
  - [ ] 時間追蹤顯示
- [ ] 實作 `getTask` API

### 6. 搜尋功能
- [ ] 搜尋 UI 元件
- [ ] 快速搜尋 Modal（Cmd/Ctrl + K）
- [ ] 實作 `searchTasks` API
- [ ] 搜尋語法支援
  - [ ] 關鍵字搜尋
  - [ ] 任務編號搜尋（#123）
  - [ ] status:open / status:closed
  - [ ] assignee:me / assignee:nobody
  - [ ] due:today / due:tomorrow
  - [ ] 組合搜尋

---

## Phase 1 (P1) - 功能擴展

### 7. 儀表板
- [ ] 儀表板頁面 UI
  - [ ] 專案列表卡片
  - [ ] 我的任務清單
  - [ ] 逾期任務警示
  - [ ] 通知圖示與數量
  - [ ] 快速新增任務按鈕
- [ ] 實作 `getOverdueTasks` API
- [ ] 整合 `searchTasks` (assignee:me status:open)

### 8. 清單檢視
- [ ] 清單頁面 UI
  - [ ] 任務表格（可自訂顯示欄位）
  - [ ] 排序控制
  - [ ] 篩選器/搜尋框
  - [ ] 分頁控制
- [ ] 實作 `getAllTasks` API
- [ ] 表格欄位自訂功能

### 9. 日曆檢視
- [ ] 日曆元件整合
- [ ] 日曆頁面 UI
  - [ ] 月曆/週曆切換
  - [ ] 任務顯示（顏色區分）
  - [ ] 今日標示
  - [ ] 導航控制
- [ ] 拖放調整到期日功能

### 10. 子任務功能
- [ ] 子任務列表元件
- [ ] 子任務進度條
- [ ] 新增子任務功能
- [ ] 子任務狀態切換
- [ ] 實作 `getAllSubtasks` API
- [ ] 實作 `createSubtask` API
- [ ] 實作 `updateSubtask` API
- [ ] 實作 `removeSubtask` API

### 11. 評論功能
- [ ] 評論列表元件
- [ ] 新增評論表單（Markdown）
- [ ] 編輯/刪除評論
- [ ] @提及使用者功能
- [ ] 實作 `getAllComments` API
- [ ] 實作 `createComment` API
- [ ] 實作 `updateComment` API
- [ ] 實作 `removeComment` API

### 12. 附件功能
- [ ] 附件列表元件
- [ ] 檔案上傳功能
- [ ] 檔案下載功能
- [ ] 圖片預覽
- [ ] 刪除附件
- [ ] 實作 `getAllTaskFiles` API
- [ ] 實作 `createTaskFile` API
- [ ] 實作 `downloadTaskFile` API
- [ ] 實作 `removeTaskFile` API

### 13. 標籤功能
- [ ] 標籤元件
- [ ] 標籤選擇器（多選）
- [ ] 實作 `getTaskTags` API
- [ ] 實作 `setTaskTags` API

### 14. 任務連結功能
- [ ] 連結列表元件
- [ ] 新增連結表單
- [ ] 實作 `getAllTaskLinks` API
- [ ] 實作 `createTaskLink` API
- [ ] 實作 `removeTaskLink` API

### 15. 通知中心
- [ ] 通知圖示元件（含未讀數量）
- [ ] 通知列表 UI
- [ ] 標記已讀功能
- [ ] 點擊跳轉功能
- [ ] 實作 `getMyActivityStream` API
- [ ] 輪詢機制

### 16. 專案設定
- [ ] 專案設定頁面
- [ ] 基本資訊編輯
  - [ ] 專案名稱
  - [ ] 專案描述
  - [ ] 開始/結束日期
- [ ] 實作 `updateProject` API
- [ ] 實作 `removeProject` API

### 17. 成員管理
- [ ] 成員列表元件
- [ ] 新增成員功能
- [ ] 移除成員功能
- [ ] 變更角色功能
- [ ] 實作 `getProjectUsers` API
- [ ] 實作 `addProjectUser` API
- [ ] 實作 `removeProjectUser` API
- [ ] 實作 `changeProjectUserRole` API

### 18. 欄位管理
- [ ] 欄位列表（可拖曳排序）
- [ ] 新增欄位表單
- [ ] 編輯欄位
- [ ] 刪除欄位
- [ ] 實作 `addColumn` API
- [ ] 實作 `updateColumn` API
- [ ] 實作 `changeColumnPosition` API
- [ ] 實作 `removeColumn` API

### 19. 泳道管理
- [ ] 泳道列表（可拖曳排序）
- [ ] 新增泳道
- [ ] 編輯泳道
- [ ] 啟用/停用泳道
- [ ] 刪除泳道
- [ ] 實作 `getAllSwimlanes` API
- [ ] 實作 `addSwimlane` API
- [ ] 實作 `updateSwimlane` API
- [ ] 實作 `changeSwimlanePosition` API
- [ ] 實作 `enableSwimlane` / `disableSwimlane` API
- [ ] 實作 `removeSwimlane` API

### 20. 類別管理
- [ ] 類別列表
- [ ] 新增類別
- [ ] 編輯類別
- [ ] 刪除類別
- [ ] 實作 `createCategory` API
- [ ] 實作 `updateCategory` API
- [ ] 實作 `removeCategory` API

### 21. 使用者設定
- [ ] 設定頁面 UI
- [ ] 個人資訊編輯
- [ ] 偏好設定
- [ ] 實作 `updateUser` API

---

## Phase 2 (P2) - 進階功能

### 22. 管理員功能 - 使用者管理
- [ ] 使用者列表頁面
- [ ] 新增使用者表單
- [ ] 編輯使用者
- [ ] 停用/啟用使用者
- [ ] 刪除使用者
- [ ] 實作 `getAllUsers` API
- [ ] 實作 `getUser` API
- [ ] 實作 `createUser` API
- [ ] 實作 `updateUser` API
- [ ] 實作 `disableUser` / `enableUser` API
- [ ] 實作 `removeUser` API

### 23. 管理員功能 - 群組管理
- [ ] 群組列表頁面
- [ ] 新增群組
- [ ] 編輯群組
- [ ] 刪除群組
- [ ] 群組成員管理
- [ ] 實作 `getAllGroups` API
- [ ] 實作 `getGroup` API
- [ ] 實作 `createGroup` API
- [ ] 實作 `updateGroup` API
- [ ] 實作 `removeGroup` API
- [ ] 實作 `getGroupMembers` API
- [ ] 實作 `addGroupMember` API
- [ ] 實作 `removeGroupMember` API

### 24. 專案分析
- [ ] 分析頁面 UI
- [ ] 任務分佈圓餅圖
- [ ] 使用者工作量圖表
- [ ] 累積流程圖
- [ ] 燃盡圖
- [ ] 平均欄位停留時間
- [ ] Lead/Cycle Time 趨勢圖
- [ ] 實作 `getProjectActivity` API

### 25. 鍵盤快捷鍵
- [ ] 快捷鍵系統架構
- [ ] 全域快捷鍵
  - [ ] `Cmd/Ctrl + K` 開啟快速搜尋
  - [ ] `?` 顯示快捷鍵說明
  - [ ] `b` 開啟專案切換器
  - [ ] `Esc` 關閉對話框
  - [ ] `Cmd/Ctrl + Enter` 提交表單
- [ ] 看板檢視快捷鍵
  - [ ] `n` 新增任務
  - [ ] `s` 展開/收縮卡片
  - [ ] `c` 緊湊/寬敞模式
  - [ ] `v b/l/c/o` 切換檢視
- [ ] 任務詳情快捷鍵
  - [ ] `e` 編輯任務
  - [ ] `s` 新增子任務
  - [ ] `c` 新增評論
  - [ ] `l` 新增連結

### 26. Kanpro 專屬功能 - 介面增強
- [ ] 深色模式支援
- [ ] 響應式設計優化
- [ ] 流暢拖放體驗優化
- [ ] 即時更新機制（輪詢）

### 27. Tauri Desktop 功能
- [ ] 系統匣整合
- [ ] 原生桌面通知
- [ ] 多伺服器支援
- [ ] 離線快取機制
- [ ] Tauri secure storage 整合

---

## 技術債務 & 優化

- [ ] 單元測試撰寫
- [ ] E2E 測試撰寫
- [ ] 效能優化（虛擬列表、懶載入）
- [ ] 國際化 (i18n) 支援
- [ ] 無障礙 (a11y) 優化
- [ ] PWA 支援
- [ ] 錯誤監控整合
- [ ] CI/CD 配置

---

## 備註

- 每個功能完成後請更新此文件
- 依據實際開發情況調整優先級
- API 實作包含錯誤處理與 loading 狀態管理
