# Kanboard API 支援對照表

本文件記錄 Kanboard 官方 API 對於各功能的支援情況，供 Kanpro 開發參考。

## 專案設定功能 API 支援

| 功能 | API 支援 | API 方法 | 說明 |
|------|:--------:|----------|------|
| Summary | ✅ | `getProjectById`, `getBoard` | |
| Custom filters | ❌ | - | 無公開 API，僅 UI 操作 |
| Edit project | ✅ | `updateProject` | |
| Predefined contents | ❌ | - | 無公開 API |
| Public access | ✅ | `enableProjectPublicAccess`, `disableProjectPublicAccess` | |
| Notifications | ⚠️ | - | 僅有 Webhook 輸出，無管理 API |
| Integrations | ⚠️ | - | 僅有 Webhook，無整合管理 API |
| Columns | ✅ | `getColumns`, `addColumn`, `updateColumn`, `changeColumnPosition`, `removeColumn` | |
| Swimlanes | ✅ | `getAllSwimlanes`, `addSwimlane`, `updateSwimlane`, `changeSwimlanePosition`, `enableSwimlane`, `disableSwimlane`, `removeSwimlane` | |
| Categories | ✅ | `getAllCategories`, `createCategory`, `updateCategory`, `removeCategory` | |
| Tags | ✅ | `getTagsByProject`, `createTag`, `updateTag`, `removeTag` | |
| Permissions | ✅ | `getProjectUsers`, `addProjectUser`, `removeProjectUser`, `changeProjectUserRole` | |
| Custom roles | ❌ | - | 無公開 API（僅能使用預設角色） |
| Automatic actions | ✅ | `getAvailableActions`, `getAvailableActionEvents`, `getActions`, `createAction`, `removeAction` | |
| Duplicate | ❌ | - | 無公開 API |
| Import tasks | ⚠️ | `duplicateTaskToProject`, `moveTaskToProject` | 需逐一處理，無批次 API |
| Close project | ✅ | `disableProject` | |
| Remove | ✅ | `removeProject` | |

## 缺乏 API 支援的功能

以下功能目前 Kanboard 官方 API 不支援，Kanpro 暫不實作：

1. **Custom filters** - 自訂篩選器 CRUD
2. **Predefined contents** - 預定義內容（任務描述模板等）
3. **Custom roles** - 自訂專案角色管理
4. **Duplicate project** - 專案複製
5. **Integrations** - 第三方整合設定（GitHub、GitLab 等）

## 參考資料

- [Kanboard API Reference](https://docs.kanboard.org/v1/api/)
- [Project API Procedures](https://docs.kanboard.org/v1/api/project_procedures/)
- [Project Permission API Procedures](https://docs.kanboard.org/v1/api/project_permission_procedures/)
- [Automatic Actions API Procedures](https://docs.kanboard.org/v1/api/action_procedures/)
