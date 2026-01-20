import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  // 通用操作
  faPlus,
  faXmark,
  faCheck,
  faSpinner,
  faPenToSquare,
  faTrash,
  faDownload,

  // 導航與選單
  faBars,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faChevronUp,
  faRightFromBracket,

  // 搜尋與新增
  faMagnifyingGlass,
  faCirclePlus,
  faSquarePlus,
  faFolderPlus,

  // 側邊欄導航
  faGauge,
  faBolt,
  faListCheck,
  faList,
  faTableColumns,
  faCalendar,
  faCalendarDays,
  faGear,
  faChartBar,
  faFolder,

  // 使用者相關
  faUser,
  faUsers,
  faUserGroup,
  faBell,

  // 主題
  faSun,
  faMoon,
  faPalette,

  // 系統與狀態
  faServer,
  faCircleQuestion,
  faCircleInfo,
  faTriangleExclamation,
  faCircleCheck,
  faCircleXmark,

  // 任務相關
  faClipboard,
  faClipboardList,
  faClipboardCheck,
  faTags,
  faTag,
  faPaperclip,
  faComment,
  faComments,
  faLink,
  faExternalLink,

  // 檔案相關
  faFile,
  faFileLines,
  faImage,

  // 其他
  faEllipsisVertical,
  faEllipsis,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faArrowDown,
  faArrowsLeftRight,
  faClock,
  faFlag,
  faStar,
  faGripVertical,
  faEye,
  faEyeSlash,
  faCopy,
  faShare,
  faRotate,
  faBan,
  faGlobe,
  faLock,
  faFaceFrown
} from '@fortawesome/free-solid-svg-icons'

// 加入 regular 版本（outline 風格）
import {
  faCalendar as faCalendarRegular,
  faComment as faCommentRegular,
  faClock as faClockRegular,
  faStar as faStarRegular,
  faCircle as faCircleRegular
} from '@fortawesome/free-regular-svg-icons'

// Add icons to library
library.add(
  // 通用操作
  faPlus,
  faXmark,
  faCheck,
  faSpinner,
  faPenToSquare,
  faTrash,
  faDownload,

  // 導航與選單
  faBars,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faChevronUp,
  faRightFromBracket,

  // 搜尋與新增
  faMagnifyingGlass,
  faCirclePlus,
  faSquarePlus,
  faFolderPlus,

  // 側邊欄導航
  faGauge,
  faBolt,
  faListCheck,
  faList,
  faTableColumns,
  faCalendar,
  faCalendarDays,
  faGear,
  faChartBar,
  faFolder,

  // 使用者相關
  faUser,
  faUsers,
  faUserGroup,
  faBell,

  // 主題
  faSun,
  faMoon,
  faPalette,

  // 系統與狀態
  faServer,
  faCircleQuestion,
  faCircleInfo,
  faTriangleExclamation,
  faCircleCheck,
  faCircleXmark,

  // 任務相關
  faClipboard,
  faClipboardList,
  faClipboardCheck,
  faTags,
  faTag,
  faPaperclip,
  faComment,
  faComments,
  faLink,
  faExternalLink,

  // 檔案相關
  faFile,
  faFileLines,
  faImage,

  // 其他
  faEllipsisVertical,
  faEllipsis,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faArrowDown,
  faArrowsLeftRight,
  faClock,
  faFlag,
  faStar,
  faGripVertical,
  faEye,
  faEyeSlash,
  faCopy,
  faShare,
  faRotate,
  faBan,
  faGlobe,
  faLock,
  faFaceFrown,

  // Regular 版本
  faCalendarRegular,
  faCommentRegular,
  faClockRegular,
  faStarRegular,
  faCircleRegular
)

export { FontAwesomeIcon }
