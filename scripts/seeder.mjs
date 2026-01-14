#!/usr/bin/env node
/**
 * Kanboard 測試資料 Seeder
 *
 * 使用方式：
 *   node scripts/seeder.mjs --url <api-url> --user <username> --pass <password>
 *
 * 範例：
 *   node scripts/seeder.mjs --url http://localhost/kanboard/jsonrpc.php --user admin --pass admin
 *   node scripts/seeder.mjs --url http://localhost/kanboard --user admin --pass admin
 *
 * 選項：
 *   --url      Kanboard API URL（會自動補上 /jsonrpc.php）
 *   --user     管理員帳號
 *   --pass     管理員密碼
 *   --users    建立使用者數量（預設 5）
 *   --groups   建立群組數量（預設 2）
 *   --projects 建立專案數量（預設 3）
 *   --tasks    每個專案的任務數量（預設 10）
 *   --clean    清除所有測試資料
 */

import { parseArgs } from 'node:util'

// 解析命令列參數
const { values: args } = parseArgs({
  options: {
    url: { type: 'string' },
    user: { type: 'string', default: 'admin' },
    pass: { type: 'string', default: 'admin' },
    users: { type: 'string', default: '5' },
    groups: { type: 'string', default: '2' },
    projects: { type: 'string', default: '3' },
    tasks: { type: 'string', default: '10' },
    clean: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false }
  }
})

if (args.help || !args.url) {
  console.log(`
Kanboard 測試資料 Seeder

使用方式：
  node scripts/seeder.mjs --url <api-url> --user <username> --pass <password>

選項：
  --url      Kanboard API URL（必填，會自動補上 /jsonrpc.php）
  --user     管理員帳號（預設: admin）
  --pass     管理員密碼（預設: admin）
  --users    建立使用者數量（預設: 5）
  --groups   建立群組數量（預設: 2）
  --projects 建立專案數量（預設: 3）
  --tasks    每個專案的任務數量（預設: 10）
  --clean    清除所有測試資料
  -h, --help 顯示說明

範例：
  node scripts/seeder.mjs --url http://localhost/kanboard --user admin --pass admin
  node scripts/seeder.mjs --url http://localhost/kanboard --users 10 --projects 5
  node scripts/seeder.mjs --url http://localhost/kanboard --clean
`)
  process.exit(args.help ? 0 : 1)
}

// 正規化 API URL
function normalizeUrl(url) {
  let normalized = url.trim()
  if (!normalized.endsWith('.php')) {
    normalized = normalized.replace(/\/$/, '') + '/jsonrpc.php'
  }
  return normalized
}

// JSON-RPC 客戶端
class KanboardClient {
  constructor(apiUrl, username, password) {
    this.apiUrl = apiUrl
    this.credentials = Buffer.from(`${username}:${password}`).toString('base64')
    this.requestId = 0
  }

  async call(method, params = {}) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${this.credentials}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        id: ++this.requestId,
        params
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const json = await response.json()
    if (json.error) {
      throw new Error(`API Error: ${json.error.message}`)
    }

    return json.result
  }
}

// 測試資料前綴（用於識別和清除）
const PREFIX = 'test_'

// 隨機選擇陣列元素
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 隨機數字
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 隨機日期（未來 30 天內）
function randomFutureDate() {
  const date = new Date()
  date.setDate(date.getDate() + randomInt(1, 30))
  return date.toISOString().split('T')[0]
}

// 顏色列表
const COLORS = ['yellow', 'blue', 'green', 'purple', 'red', 'orange', 'grey', 'brown', 'pink', 'cyan']

// 任務標題模板
const TASK_TITLES = [
  '實作登入功能',
  '修復 UI 問題',
  '撰寫單元測試',
  '優化效能',
  '更新文件',
  '重構程式碼',
  '新增 API 端點',
  '設計資料庫結構',
  '建立部署流程',
  '修正安全漏洞',
  '整合第三方服務',
  '設計使用者介面',
  '實作搜尋功能',
  '新增匯出功能',
  '建立報表系統',
  '優化載入速度',
  '修復跨瀏覽器問題',
  '實作通知系統',
  '建立快取機制',
  '撰寫 E2E 測試'
]

// Seeder 主類別
class Seeder {
  constructor(client) {
    this.client = client
    this.users = []
    this.groups = []
    this.projects = []
  }

  log(message) {
    console.log(`[Seeder] ${message}`)
  }

  // 建立使用者
  async createUsers(count) {
    this.log(`建立 ${count} 個使用者...`)

    for (let i = 1; i <= count; i++) {
      const username = `${PREFIX}user${i}`
      const name = `測試使用者 ${i}`
      const email = `${username}@test.local`

      try {
        const userId = await this.client.call('createUser', {
          username,
          password: 'test1234',
          name,
          email
        })

        if (userId) {
          this.users.push({ id: userId, username, name })
          this.log(`  ✓ 建立使用者: ${name} (${username})`)
        }
      } catch (error) {
        // 使用者可能已存在
        this.log(`  ⚠ 使用者 ${username} 可能已存在`)
      }
    }
  }

  // 建立群組
  async createGroups(count) {
    this.log(`建立 ${count} 個群組...`)

    const groupNames = ['開發團隊', '設計團隊', 'QA 團隊', '產品團隊', '營運團隊']

    for (let i = 1; i <= count; i++) {
      const name = `${PREFIX}${groupNames[i - 1] || `群組 ${i}`}`

      try {
        const groupId = await this.client.call('createGroup', { name })

        if (groupId) {
          this.groups.push({ id: groupId, name })
          this.log(`  ✓ 建立群組: ${name}`)

          // 將部分使用者加入群組
          const membersCount = Math.min(randomInt(2, 4), this.users.length)
          const shuffled = [...this.users].sort(() => Math.random() - 0.5)

          for (let j = 0; j < membersCount; j++) {
            await this.client.call('addGroupMember', {
              group_id: groupId,
              user_id: shuffled[j].id
            })
            this.log(`    + 加入成員: ${shuffled[j].name}`)
          }
        }
      } catch (error) {
        this.log(`  ⚠ 群組建立失敗: ${error.message}`)
      }
    }
  }

  // 建立專案
  async createProjects(count) {
    this.log(`建立 ${count} 個專案...`)

    const projectNames = [
      'Kanpro 前端開發',
      'API 整合專案',
      '行動應用程式',
      '後台管理系統',
      '資料分析平台',
      '電商網站',
      '社群平台',
      '物聯網專案'
    ]

    for (let i = 1; i <= count; i++) {
      const name = `${PREFIX}${projectNames[i - 1] || `專案 ${i}`}`
      const description = `這是 ${name} 的描述。\n\n## 目標\n- 完成核心功能\n- 通過測試\n- 部署上線`

      try {
        const projectId = await this.client.call('createProject', {
          name,
          description
        })

        if (projectId) {
          this.projects.push({ id: projectId, name })
          this.log(`  ✓ 建立專案: ${name}`)

          // 將使用者加入專案
          const membersCount = Math.min(randomInt(2, 5), this.users.length)
          const shuffled = [...this.users].sort(() => Math.random() - 0.5)

          for (let j = 0; j < membersCount; j++) {
            const role = j === 0 ? 'project-manager' : 'project-member'
            await this.client.call('addProjectUser', {
              project_id: projectId,
              user_id: shuffled[j].id,
              role
            })
            this.log(`    + 加入成員: ${shuffled[j].name} (${role})`)
          }

          // 建立泳道
          await this.createSwimlanes(projectId)

          // 建立類別
          await this.createCategories(projectId)
        }
      } catch (error) {
        this.log(`  ⚠ 專案建立失敗: ${error.message}`)
      }
    }
  }

  // 建立泳道
  async createSwimlanes(projectId) {
    const swimlanes = ['Sprint 1', 'Sprint 2', 'Backlog']

    for (const name of swimlanes) {
      try {
        await this.client.call('addSwimlane', {
          project_id: projectId,
          name: `${PREFIX}${name}`
        })
        this.log(`    + 建立泳道: ${name}`)
      } catch (error) {
        // 忽略錯誤
      }
    }
  }

  // 建立類別
  async createCategories(projectId) {
    const categories = ['Bug', 'Feature', 'Enhancement', 'Documentation']

    for (const name of categories) {
      try {
        await this.client.call('createCategory', {
          project_id: projectId,
          name: `${PREFIX}${name}`
        })
        this.log(`    + 建立類別: ${name}`)
      } catch (error) {
        // 忽略錯誤
      }
    }
  }

  // 建立任務
  async createTasks(tasksPerProject) {
    this.log(`每個專案建立 ${tasksPerProject} 個任務...`)

    for (const project of this.projects) {
      this.log(`  專案: ${project.name}`)

      // 取得專案的欄位和泳道
      const columns = await this.client.call('getColumns', { project_id: project.id })
      const swimlanes = await this.client.call('getActiveSwimlanes', { project_id: project.id })
      const categories = await this.client.call('getAllCategories', { project_id: project.id })
      const members = await this.client.call('getProjectUsers', { project_id: project.id })

      const memberIds = Object.keys(members || {}).map(Number)
      const categoryIds = (categories || []).map(c => c.id)

      for (let i = 1; i <= tasksPerProject; i++) {
        const title = `${PREFIX}${randomChoice(TASK_TITLES)} #${i}`
        const description = `## 描述\n這是任務 "${title}" 的詳細描述。\n\n## 驗收條件\n- [ ] 條件 1\n- [ ] 條件 2\n- [ ] 條件 3`

        try {
          const taskId = await this.client.call('createTask', {
            project_id: project.id,
            title,
            description,
            color_id: randomChoice(COLORS),
            column_id: randomChoice(columns)?.id,
            swimlane_id: swimlanes?.length > 1 ? randomChoice(swimlanes.slice(1))?.id : undefined,
            owner_id: memberIds.length > 0 ? randomChoice(memberIds) : undefined,
            category_id: categoryIds.length > 0 ? randomChoice(categoryIds) : undefined,
            date_due: Math.random() > 0.5 ? randomFutureDate() : undefined,
            score: randomInt(1, 8),
            priority: randomInt(0, 3)
          })

          if (taskId) {
            this.log(`    ✓ 建立任務: ${title}`)

            // 建立子任務
            if (Math.random() > 0.5) {
              await this.createSubtasks(taskId, memberIds)
            }

            // 建立評論
            if (Math.random() > 0.6) {
              await this.createComments(taskId, memberIds)
            }
          }
        } catch (error) {
          this.log(`    ⚠ 任務建立失敗: ${error.message}`)
        }
      }
    }
  }

  // 建立子任務
  async createSubtasks(taskId, memberIds) {
    const subtaskCount = randomInt(2, 5)
    const subtaskTitles = ['研究', '實作', '測試', '文件', '部署', '驗收']

    for (let i = 0; i < subtaskCount; i++) {
      try {
        await this.client.call('createSubtask', {
          task_id: taskId,
          title: `${PREFIX}${subtaskTitles[i] || `子任務 ${i + 1}`}`,
          user_id: memberIds.length > 0 ? randomChoice(memberIds) : undefined,
          status: randomInt(0, 2)
        })
      } catch (error) {
        // 忽略錯誤
      }
    }
  }

  // 建立評論
  async createComments(taskId, memberIds) {
    const comments = [
      '這個功能看起來不錯！',
      '我有一些建議...',
      '請確認一下這個實作方式',
      '已經完成初步測試',
      '需要再討論一下細節'
    ]

    const commentCount = randomInt(1, 3)

    for (let i = 0; i < commentCount; i++) {
      try {
        await this.client.call('createComment', {
          task_id: taskId,
          content: `${PREFIX}${randomChoice(comments)}`,
          user_id: memberIds.length > 0 ? randomChoice(memberIds) : undefined
        })
      } catch (error) {
        // 忽略錯誤
      }
    }
  }

  // 建立任務連結
  async createTaskLinks() {
    if (this.projects.length < 2) return

    this.log('建立任務連結...')

    // 取得所有任務
    for (const project of this.projects) {
      const tasks = await this.client.call('getAllTasks', {
        project_id: project.id,
        status_id: 1
      })

      if (tasks && tasks.length >= 2) {
        // 隨機連結一些任務
        const linkCount = Math.min(3, Math.floor(tasks.length / 2))

        for (let i = 0; i < linkCount; i++) {
          const task1 = tasks[i * 2]
          const task2 = tasks[i * 2 + 1]

          try {
            await this.client.call('createTaskLink', {
              task_id: task1.id,
              opposite_task_id: task2.id,
              link_id: randomInt(1, 4)
            })
            this.log(`  ✓ 連結任務: #${task1.id} <-> #${task2.id}`)
          } catch (error) {
            // 忽略錯誤
          }
        }
      }
    }
  }

  // 清除測試資料
  async clean() {
    this.log('清除測試資料...')

    // 取得所有專案
    const projects = await this.client.call('getAllProjects')
    for (const project of projects || []) {
      if (project.name.startsWith(PREFIX)) {
        try {
          await this.client.call('removeProject', { project_id: project.id })
          this.log(`  ✓ 刪除專案: ${project.name}`)
        } catch (error) {
          this.log(`  ⚠ 刪除專案失敗: ${project.name}`)
        }
      }
    }

    // 取得所有群組
    const groups = await this.client.call('getAllGroups')
    for (const group of groups || []) {
      if (group.name.startsWith(PREFIX)) {
        try {
          await this.client.call('removeGroup', { group_id: group.id })
          this.log(`  ✓ 刪除群組: ${group.name}`)
        } catch (error) {
          this.log(`  ⚠ 刪除群組失敗: ${group.name}`)
        }
      }
    }

    // 取得所有使用者
    const users = await this.client.call('getAllUsers')
    for (const user of users || []) {
      if (user.username.startsWith(PREFIX)) {
        try {
          await this.client.call('removeUser', { user_id: user.id })
          this.log(`  ✓ 刪除使用者: ${user.username}`)
        } catch (error) {
          this.log(`  ⚠ 刪除使用者失敗: ${user.username}`)
        }
      }
    }

    this.log('清除完成！')
  }

  // 執行 seeding
  async seed(options) {
    const { users, groups, projects, tasks } = options

    this.log('開始建立測試資料...')
    this.log(`設定: ${users} 使用者, ${groups} 群組, ${projects} 專案, 每專案 ${tasks} 任務`)
    console.log('')

    // 依序建立資料（有相依性）
    await this.createUsers(users)
    console.log('')

    await this.createGroups(groups)
    console.log('')

    await this.createProjects(projects)
    console.log('')

    await this.createTasks(tasks)
    console.log('')

    await this.createTaskLinks()
    console.log('')

    this.log('測試資料建立完成！')
    this.log(`共建立: ${this.users.length} 使用者, ${this.groups.length} 群組, ${this.projects.length} 專案`)
  }
}

// 主程式
async function main() {
  const apiUrl = normalizeUrl(args.url)
  const client = new KanboardClient(apiUrl, args.user, args.pass)

  console.log('')
  console.log('='.repeat(50))
  console.log('Kanboard 測試資料 Seeder')
  console.log('='.repeat(50))
  console.log(`API URL: ${apiUrl}`)
  console.log(`使用者: ${args.user}`)
  console.log('')

  // 測試連線
  try {
    const me = await client.call('getMe')
    console.log(`連線成功！登入身份: ${me.name} (${me.username})`)
    console.log('')
  } catch (error) {
    console.error(`連線失敗: ${error.message}`)
    process.exit(1)
  }

  const seeder = new Seeder(client)

  if (args.clean) {
    await seeder.clean()
  } else {
    await seeder.seed({
      users: parseInt(args.users, 10),
      groups: parseInt(args.groups, 10),
      projects: parseInt(args.projects, 10),
      tasks: parseInt(args.tasks, 10)
    })
  }
}

main().catch(error => {
  console.error('錯誤:', error.message)
  process.exit(1)
})
