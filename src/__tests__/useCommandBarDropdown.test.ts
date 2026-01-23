import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCommandBarDropdown } from '@/composables/useCommandBarDropdown'
import { useProjectsStore } from '@/stores/projects'
import { useMembersStore } from '@/stores/members'
import { useTagsStore } from '@/stores/tags'
import { useColumnsStore } from '@/stores/columns'

// Mock stores
vi.mock('@/stores/projects', () => ({
  useProjectsStore: vi.fn()
}))

vi.mock('@/stores/members', () => ({
  useMembersStore: vi.fn()
}))

vi.mock('@/stores/tags', () => ({
  useTagsStore: vi.fn()
}))

vi.mock('@/stores/columns', () => ({
  useColumnsStore: vi.fn()
}))

describe('useCommandBarDropdown', () => {
  beforeEach(() => {
    setActivePinia(createPinia())

    // Mock projects store
    vi.mocked(useProjectsStore).mockReturnValue({
      activeProjects: [
        { id: 1, name: 'Project Alpha', is_active: true },
        { id: 2, name: 'Project Beta', is_active: true },
        { id: 3, name: 'Development', is_active: true }
      ]
    } as any)

    // Mock members store
    vi.mocked(useMembersStore).mockReturnValue({
      members: [
        { id: 1, name: 'John Doe', username: 'john' },
        { id: 2, name: 'Jane Smith', username: 'jane' },
        { id: 3, name: 'Bob Wilson', username: 'bob' }
      ],
      assignableUsers: [
        { id: 1, name: 'John Doe', username: 'john' },
        { id: 2, name: 'Jane Smith', username: 'jane' },
        { id: 3, name: 'Bob Wilson', username: 'bob' }
      ]
    } as any)

    // Mock tags store
    vi.mocked(useTagsStore).mockReturnValue({
      projectTags: [
        { id: 1, name: 'urgent' },
        { id: 2, name: 'bug' },
        { id: 3, name: 'feature' }
      ]
    } as any)

    // Mock columns store
    vi.mocked(useColumnsStore).mockReturnValue({
      sortedColumns: [
        { id: 1, title: 'Backlog', position: 1 },
        { id: 2, title: 'In Progress', position: 2 },
        { id: 3, title: 'Done', position: 3 }
      ]
    } as any)
  })

  describe('loadOptions', () => {
    it('should load project options for ^ symbol', () => {
      const { loadOptions, options } = useCommandBarDropdown()

      loadOptions('^', 1)

      expect(options.value).toHaveLength(3)
      expect(options.value[0]).toMatchObject({
        id: 1,
        label: 'Project Alpha',
        value: 'Project Alpha',
        type: 'project'
      })
    })

    it('should load member options for @ symbol', () => {
      const { loadOptions, options } = useCommandBarDropdown()

      loadOptions('@', 1)

      expect(options.value).toHaveLength(3)
      expect(options.value[0]).toMatchObject({
        id: 1,
        label: 'John Doe',
        value: 'john',
        type: 'assignee'
      })
    })

    it('should load tag options for # symbol', () => {
      const { loadOptions, options } = useCommandBarDropdown()

      loadOptions('#', 1)

      expect(options.value).toHaveLength(3)
      expect(options.value[0]).toMatchObject({
        id: 1,
        label: 'urgent',
        value: 'urgent',
        type: 'tag'
      })
    })

    it('should load column options for : symbol', () => {
      const { loadOptions, options } = useCommandBarDropdown()

      loadOptions(':', 1)

      expect(options.value).toHaveLength(3)
      expect(options.value[0]).toMatchObject({
        id: 1,
        label: 'Backlog',
        value: 'Backlog',
        type: 'column'
      })
    })

    it('should load priority options for ! symbol', () => {
      const { loadOptions, options } = useCommandBarDropdown()

      loadOptions('!', 1)

      expect(options.value).toHaveLength(4)
      expect(options.value[0]).toMatchObject({
        id: 0,
        label: '0 - 無優先級',
        value: '0',
        type: 'priority'
      })
    })

    it('should load due date options for > symbol', () => {
      const { loadOptions, options } = useCommandBarDropdown()

      loadOptions('>', 1)

      expect(options.value).toHaveLength(3)
      expect(options.value[0]).toMatchObject({
        id: 'today',
        label: '今天',
        value: 'today',
        type: 'due'
      })
    })
  })

  describe('filterOptions', () => {
    it('should filter options by query', () => {
      const { loadOptions, filterOptions, filteredOptions } = useCommandBarDropdown()

      loadOptions('^', 1)
      filterOptions('dev')

      expect(filteredOptions.value).toHaveLength(1)
      expect(filteredOptions.value[0].label).toBe('Development')
    })

    it('should be case insensitive', () => {
      const { loadOptions, filterOptions, filteredOptions } = useCommandBarDropdown()

      loadOptions('^', 1)
      filterOptions('ALPHA')

      expect(filteredOptions.value).toHaveLength(1)
      expect(filteredOptions.value[0].label).toBe('Project Alpha')
    })

    it('should return all options when query is empty', () => {
      const { loadOptions, filterOptions, filteredOptions } = useCommandBarDropdown()

      loadOptions('^', 1)
      filterOptions('')

      expect(filteredOptions.value).toHaveLength(3)
    })
  })

  describe('keyboard navigation', () => {
    it('should start with selectedIndex at 0', () => {
      const { selectedIndex } = useCommandBarDropdown()

      expect(selectedIndex.value).toBe(0)
    })

    it('should move down', () => {
      const { loadOptions, moveDown, selectedIndex } = useCommandBarDropdown()

      loadOptions('^', 1)
      moveDown()

      expect(selectedIndex.value).toBe(1)
    })

    it('should wrap around when moving down at the end', () => {
      const { loadOptions, moveDown, selectedIndex } = useCommandBarDropdown()

      loadOptions('^', 1)
      moveDown()
      moveDown()
      moveDown() // Should wrap to 0

      expect(selectedIndex.value).toBe(0)
    })

    it('should move up', () => {
      const { loadOptions, moveDown, moveUp, selectedIndex } = useCommandBarDropdown()

      loadOptions('^', 1)
      moveDown()
      moveDown()
      moveUp()

      expect(selectedIndex.value).toBe(1)
    })

    it('should wrap around when moving up at the beginning', () => {
      const { loadOptions, moveUp, selectedIndex } = useCommandBarDropdown()

      loadOptions('^', 1)
      moveUp() // Should wrap to last (index 2)

      expect(selectedIndex.value).toBe(2)
    })

    it('should reset selectedIndex when loading new options', () => {
      const { loadOptions, moveDown, selectedIndex } = useCommandBarDropdown()

      loadOptions('^', 1)
      moveDown()
      moveDown()

      loadOptions('@', 1)

      expect(selectedIndex.value).toBe(0)
    })
  })

  describe('getSelectedOption', () => {
    it('should return the currently selected option', () => {
      const { loadOptions, moveDown, getSelectedOption } = useCommandBarDropdown()

      loadOptions('^', 1)
      moveDown()

      const selected = getSelectedOption()
      expect(selected?.label).toBe('Project Beta')
    })

    it('should return undefined when no options', () => {
      const { getSelectedOption } = useCommandBarDropdown()

      const selected = getSelectedOption()
      expect(selected).toBeUndefined()
    })
  })

  describe('symbol behavior', () => {
    describe('canCreateNew', () => {
      it('should return true for # (tag) symbol', () => {
        const { loadOptions, canCreateNew } = useCommandBarDropdown()

        loadOptions('#', 1)

        expect(canCreateNew.value).toBe(true)
      })

      it('should return false for ^ (project) symbol', () => {
        const { loadOptions, canCreateNew } = useCommandBarDropdown()

        loadOptions('^', 1)

        expect(canCreateNew.value).toBe(false)
      })

      it('should return false for @ (assignee) symbol', () => {
        const { loadOptions, canCreateNew } = useCommandBarDropdown()

        loadOptions('@', 1)

        expect(canCreateNew.value).toBe(false)
      })
    })

    describe('emptyMessage', () => {
      it('should return appropriate message for each symbol type', () => {
        const { loadOptions, emptyMessage } = useCommandBarDropdown()

        loadOptions('^', 1)
        expect(emptyMessage.value).toBe('無符合的專案')

        loadOptions('@', 1)
        expect(emptyMessage.value).toBe('無符合的使用者')

        loadOptions('#', 1)
        expect(emptyMessage.value).toBe('') // Tags can be created

        loadOptions(':', 1)
        expect(emptyMessage.value).toBe('無符合的欄位')

        loadOptions('!', 1)
        expect(emptyMessage.value).toBe('無符合的優先級')

        loadOptions('>', 1)
        expect(emptyMessage.value).toBe('無符合的到期日')
      })
    })
  })

  describe('reset', () => {
    it('should clear all state', () => {
      const { loadOptions, moveDown, filterOptions, reset, options, selectedIndex, filteredOptions } = useCommandBarDropdown()

      loadOptions('^', 1)
      moveDown()
      filterOptions('alpha')

      reset()

      expect(options.value).toHaveLength(0)
      expect(selectedIndex.value).toBe(0)
      expect(filteredOptions.value).toHaveLength(0)
    })
  })
})
