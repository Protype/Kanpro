import type { App } from 'vue'
import {
  // 通用操作
  PhPlus,
  PhX,
  PhCheck,
  PhSpinnerGap,
  PhPencilSimple,
  PhTrash,
  PhDownloadSimple,
  PhUploadSimple,
  PhCamera,

  // 導航與選單
  PhList,
  PhCaretLeft,
  PhCaretRight,
  PhCaretDown,
  PhCaretUp,
  PhSignOut,

  // 搜尋與新增
  PhMagnifyingGlass,
  PhPlusCircle,
  PhFolderPlus,
  PhFolderSimplePlus,
  PhCirclesThreePlus,

  // 側邊欄導航
  PhGauge,
  PhLightning,
  PhListChecks,
  PhColumns,
  PhCalendarBlank,
  PhCalendar,
  PhGear,
  PhGearSix,
  PhChartBar,
  PhFolder,
  PhFolderOpen,
  PhSquaresFour,
  PhPulse,

  // 使用者相關
  PhUser,
  PhUsers,
  PhUsersThree,
  PhBell,

  // 主題
  PhSun,
  PhMoon,
  PhPalette,

  // 系統與狀態
  PhGlobe,
  PhGlobeSimple,
  PhPlug,
  PhPlugs,
  PhPlugsConnected,
  PhQuestion,
  PhInfo,
  PhWarning,
  PhCheckCircle,
  PhXCircle,
  PhDatabase,
  PhHardDrives,

  // 任務相關
  PhClipboard,
  PhClipboardText,
  PhTag,
  PhPaperclip,
  PhChatCircle,
  PhChats,
  PhLink,
  PhArrowSquareOut,

  // 檔案相關
  PhFile,
  PhFileText,
  PhImage,

  // 其他
  PhDotsThreeVertical,
  PhDotsThree,
  PhArrowLeft,
  PhArrowRight,
  PhArrowUp,
  PhArrowDown,
  PhArrowsLeftRight,
  PhArrowsOut,
  PhClock,
  PhFlag,
  PhStar,
  PhDotsSixVertical,
  PhEye,
  PhEyeSlash,
  PhCopy,
  PhShare,
  PhArrowClockwise,
  PhProhibit,
  PhLock,
  PhSmileyXEyes,
  PhCircle,
  PhShield,
  PhShieldCheck
} from '@phosphor-icons/vue'

// 圖示名稱對應表（用於動態載入）
export const iconComponents = {
  // 通用操作
  'plus': PhPlus,
  'x': PhX,
  'xmark': PhX,
  'check': PhCheck,
  'spinner': PhSpinnerGap,
  'spinner-gap': PhSpinnerGap,
  'pencil': PhPencilSimple,
  'pen-to-square': PhPencilSimple,
  'trash': PhTrash,
  'download': PhDownloadSimple,
  'upload-simple': PhUploadSimple,
  'upload': PhUploadSimple,
  'camera': PhCamera,

  // 導航與選單
  'list': PhList,
  'bars': PhList,
  'caret-left': PhCaretLeft,
  'caret-right': PhCaretRight,
  'caret-down': PhCaretDown,
  'caret-up': PhCaretUp,
  'chevron-left': PhCaretLeft,
  'chevron-right': PhCaretRight,
  'chevron-down': PhCaretDown,
  'chevron-up': PhCaretUp,
  'sign-out': PhSignOut,
  'right-from-bracket': PhSignOut,

  // 搜尋與新增
  'magnifying-glass': PhMagnifyingGlass,
  'plus-circle': PhPlusCircle,
  'circle-plus': PhPlusCircle,
  'folder-plus': PhFolderPlus,
  'folder-simple-plus': PhFolderSimplePlus,
  'circles-three-plus': PhCirclesThreePlus,

  // 側邊欄導航
  'gauge': PhGauge,
  'lightning': PhLightning,
  'bolt': PhLightning,
  'list-checks': PhListChecks,
  'list-check': PhListChecks,
  'columns': PhColumns,
  'table-columns': PhColumns,
  'calendar-blank': PhCalendarBlank,
  'calendar': PhCalendar,
  'gear': PhGear,
  'gear-six': PhGearSix,
  'chart-bar': PhChartBar,
  'folder': PhFolder,
  'folder-open': PhFolderOpen,
  'squares-four': PhSquaresFour,
  'pulse': PhPulse,

  // 使用者相關
  'user': PhUser,
  'users': PhUsers,
  'users-three': PhUsersThree,
  'user-group': PhUsersThree,
  'bell': PhBell,

  // 主題
  'sun': PhSun,
  'moon': PhMoon,
  'palette': PhPalette,

  // 系統與狀態
  'globe': PhGlobe,
  'globe-simple': PhGlobeSimple,
  'plug': PhPlug,
  'plugs': PhPlugs,
  'plugs-connected': PhPlugsConnected,
  'question': PhQuestion,
  'circle-question': PhQuestion,
  'info': PhInfo,
  'circle-info': PhInfo,
  'warning': PhWarning,
  'triangle-exclamation': PhWarning,
  'check-circle': PhCheckCircle,
  'circle-check': PhCheckCircle,
  'x-circle': PhXCircle,
  'circle-xmark': PhXCircle,
  'database': PhDatabase,
  'server': PhHardDrives,
  'hard-drives': PhHardDrives,

  // 任務相關
  'clipboard': PhClipboard,
  'clipboard-text': PhClipboardText,
  'clipboard-list': PhClipboardText,
  'clipboard-check': PhClipboardText,
  'tag': PhTag,
  'paperclip': PhPaperclip,
  'chat-circle': PhChatCircle,
  'comment': PhChatCircle,
  'chats': PhChats,
  'comments': PhChats,
  'link': PhLink,
  'arrow-square-out': PhArrowSquareOut,
  'external-link': PhArrowSquareOut,

  // 檔案相關
  'file': PhFile,
  'file-text': PhFileText,
  'file-lines': PhFileText,
  'image': PhImage,

  // 其他
  'dots-three-vertical': PhDotsThreeVertical,
  'ellipsis-vertical': PhDotsThreeVertical,
  'dots-three': PhDotsThree,
  'ellipsis': PhDotsThree,
  'arrow-left': PhArrowLeft,
  'arrow-right': PhArrowRight,
  'arrow-up': PhArrowUp,
  'arrow-down': PhArrowDown,
  'arrows-left-right': PhArrowsLeftRight,
  'arrows-out': PhArrowsOut,
  'expand': PhArrowsOut,
  'clock': PhClock,
  'flag': PhFlag,
  'star': PhStar,
  'dots-six-vertical': PhDotsSixVertical,
  'grip-vertical': PhDotsSixVertical,
  'eye': PhEye,
  'eye-slash': PhEyeSlash,
  'copy': PhCopy,
  'share': PhShare,
  'arrow-clockwise': PhArrowClockwise,
  'rotate': PhArrowClockwise,
  'prohibit': PhProhibit,
  'ban': PhProhibit,
  'lock': PhLock,
  'face-frown': PhSmileyXEyes,
  'circle': PhCircle,
  'shield': PhShield,
  'shield-check': PhShieldCheck
} as const

export type IconName = keyof typeof iconComponents

export function installPhosphorIcons(app: App) {
  // 註冊所有圖示為全域元件
  Object.entries(iconComponents).forEach(([name, component]) => {
    app.component(`ph-${name}`, component)
  })
}

export default {
  install: installPhosphorIcons
}
