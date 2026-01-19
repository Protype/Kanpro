import { ref, computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useMembersStore } from '@/stores/members'
import { useTagsStore } from '@/stores/tags'
import { useColumnsStore } from '@/stores/columns'

export interface DropdownOption {
  id: string | number
  label: string
  value: string
  type: 'project' | 'assignee' | 'tag' | 'column' | 'priority' | 'due'
  icon?: string
  color?: string
  suffix?: string
}

interface SymbolConfig {
  symbol: string
  canCreate: boolean
  emptyMessage: string
}

const SYMBOL_CONFIGS: Record<string, SymbolConfig> = {
  '^': { symbol: '^', canCreate: false, emptyMessage: '無符合的專案' },
  '@': { symbol: '@', canCreate: false, emptyMessage: '無符合的使用者' },
  '#': { symbol: '#', canCreate: true, emptyMessage: '' },
  ':': { symbol: ':', canCreate: false, emptyMessage: '無符合的欄位' },
  '!': { symbol: '!', canCreate: false, emptyMessage: '無符合的優先級' },
  '>': { symbol: '>', canCreate: false, emptyMessage: '無符合的到期日' }
}

const PRIORITY_OPTIONS: DropdownOption[] = [
  { id: 0, label: '0 - 無優先級', value: '0', type: 'priority' },
  { id: 1, label: '1 - 低', value: '1', type: 'priority' },
  { id: 2, label: '2 - 中', value: '2', type: 'priority' },
  { id: 3, label: '3 - 高', value: '3', type: 'priority' }
]

const DUE_DATE_OPTIONS: DropdownOption[] = [
  { id: 'today', label: '今天', value: 'today', type: 'due' },
  { id: 'tomorrow', label: '明天', value: 'tomorrow', type: 'due' },
  { id: 'next_week', label: '下週', value: 'next week', type: 'due' }
]

/**
 * Composable for managing CommandBar dropdown options
 */
export function useCommandBarDropdown() {
  const options = ref<DropdownOption[]>([])
  const selectedIndex = ref(0)
  const query = ref('')
  const currentSymbol = ref<string>('')

  // Computed
  const MAX_DISPLAY_OPTIONS = 5

  const filteredOptions = computed(() => {
    let result: DropdownOption[]

    if (!query.value.trim()) {
      // No query - show up to MAX_DISPLAY_OPTIONS items
      result = options.value.slice(0, MAX_DISPLAY_OPTIONS)
    } else {
      // Has query - filter and limit results
      const lowerQuery = query.value.toLowerCase()
      result = options.value
        .filter(opt =>
          opt.label.toLowerCase().includes(lowerQuery) ||
          opt.value.toLowerCase().includes(lowerQuery)
        )
        .slice(0, MAX_DISPLAY_OPTIONS)
    }

    return result
  })

  const canCreateNew = computed(() => {
    const config = SYMBOL_CONFIGS[currentSymbol.value]
    return config?.canCreate ?? false
  })

  const emptyMessage = computed(() => {
    const config = SYMBOL_CONFIGS[currentSymbol.value]
    return config?.emptyMessage ?? ''
  })

  const hasOptions = computed(() => filteredOptions.value.length > 0)

  // Methods
  function loadOptions(symbol: string, _projectId: number) {
    currentSymbol.value = symbol
    selectedIndex.value = 0
    query.value = ''

    switch (symbol) {
      case '^':
        loadProjectOptions()
        break
      case '@':
        loadMemberOptions()
        break
      case '#':
        loadTagOptions()
        break
      case ':':
        loadColumnOptions()
        break
      case '!':
        loadPriorityOptions()
        break
      case '>':
        loadDueDateOptions()
        break
      default:
        options.value = []
    }
  }

  function loadProjectOptions() {
    const projectsStore = useProjectsStore()
    options.value = projectsStore.activeProjects.map(p => {
      // Show identifier if available, otherwise show ID number
      const idSuffix = p.identifier ? `#${p.identifier}` : `#${p.id}`
      return {
        id: p.id,
        label: p.name,
        value: p.name,
        type: 'project' as const,
        suffix: idSuffix
      }
    })
  }

  function loadMemberOptions() {
    const membersStore = useMembersStore()
    options.value = membersStore.members.map(m => ({
      id: m.id,
      label: m.name || m.username,
      value: m.username,
      type: 'assignee' as const
    }))
  }

  function loadTagOptions() {
    const tagsStore = useTagsStore()
    options.value = tagsStore.projectTags.map(t => ({
      id: t.id,
      label: t.name,
      value: t.name,
      type: 'tag' as const
    }))
  }

  function loadColumnOptions() {
    const columnsStore = useColumnsStore()
    options.value = columnsStore.sortedColumns.map(c => ({
      id: c.id,
      label: c.title,
      value: c.title,
      type: 'column' as const
    }))
  }

  function loadPriorityOptions() {
    options.value = [...PRIORITY_OPTIONS]
  }

  function loadDueDateOptions() {
    options.value = [...DUE_DATE_OPTIONS]
  }

  function filterOptions(searchQuery: string) {
    query.value = searchQuery
    // Reset selectedIndex when filtering changes results
    if (selectedIndex.value >= filteredOptions.value.length) {
      selectedIndex.value = 0
    }
  }

  function moveDown() {
    if (filteredOptions.value.length === 0) return
    selectedIndex.value = (selectedIndex.value + 1) % filteredOptions.value.length
  }

  function moveUp() {
    if (filteredOptions.value.length === 0) return
    selectedIndex.value = selectedIndex.value === 0
      ? filteredOptions.value.length - 1
      : selectedIndex.value - 1
  }

  function getSelectedOption(): DropdownOption | undefined {
    return filteredOptions.value[selectedIndex.value]
  }

  function reset() {
    options.value = []
    selectedIndex.value = 0
    query.value = ''
    currentSymbol.value = ''
  }

  return {
    options,
    selectedIndex,
    query,
    currentSymbol,
    filteredOptions,
    canCreateNew,
    emptyMessage,
    hasOptions,
    loadOptions,
    filterOptions,
    moveDown,
    moveUp,
    getSelectedOption,
    reset
  }
}
