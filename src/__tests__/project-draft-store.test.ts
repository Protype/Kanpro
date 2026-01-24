import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectDraftStore } from '@/stores/projectDraft'

describe('ProjectDraft Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should have empty draft', () => {
      const store = useProjectDraftStore()

      expect(store.draft).toEqual({
        name: '',
        description: '',
        identifier: '',
        ownerId: null,
        startDate: '',
        endDate: '',
        priorityDefault: undefined,
        priorityStart: undefined,
        priorityEnd: undefined,
        email: '',
        enablePublicAccess: false
      })
    })

    it('should have empty cached members', () => {
      const store = useProjectDraftStore()
      expect(store.cachedMembers).toEqual([])
    })

    it('should have empty cached categories', () => {
      const store = useProjectDraftStore()
      expect(store.cachedCategories).toEqual([])
    })

    it('should have empty cached columns', () => {
      const store = useProjectDraftStore()
      expect(store.cachedColumns).toEqual([])
    })

    it('should have empty cached swimlanes', () => {
      const store = useProjectDraftStore()
      expect(store.cachedSwimlanes).toEqual([])
    })

    it('should not have draft data initially', () => {
      const store = useProjectDraftStore()
      expect(store.hasDraftData).toBe(false)
    })
  })

  describe('updateDraft', () => {
    it('should update draft fields', () => {
      const store = useProjectDraftStore()

      store.updateDraft({
        name: 'Test Project',
        description: 'Test Description'
      })

      expect(store.draft.name).toBe('Test Project')
      expect(store.draft.description).toBe('Test Description')
    })

    it('should merge with existing draft', () => {
      const store = useProjectDraftStore()

      store.updateDraft({ name: 'Project A' })
      store.updateDraft({ description: 'Description A' })

      expect(store.draft.name).toBe('Project A')
      expect(store.draft.description).toBe('Description A')
    })

    it('should set hasDraftData to true when name is filled', () => {
      const store = useProjectDraftStore()

      store.updateDraft({ name: 'Project' })

      expect(store.hasDraftData).toBe(true)
    })
  })

  describe('cached members', () => {
    it('should add member to cache', () => {
      const store = useProjectDraftStore()

      store.addCachedMember({ userId: 1, role: 'project-member' })

      expect(store.cachedMembers).toHaveLength(1)
      expect(store.cachedMembers[0]).toEqual({ userId: 1, role: 'project-member' })
    })

    it('should not add duplicate member', () => {
      const store = useProjectDraftStore()

      store.addCachedMember({ userId: 1, role: 'project-member' })
      store.addCachedMember({ userId: 1, role: 'project-manager' })

      expect(store.cachedMembers).toHaveLength(1)
      expect(store.cachedMembers[0].role).toBe('project-manager')
    })

    it('should remove member from cache', () => {
      const store = useProjectDraftStore()

      store.addCachedMember({ userId: 1, role: 'project-member' })
      store.addCachedMember({ userId: 2, role: 'project-member' })
      store.removeCachedMember(1)

      expect(store.cachedMembers).toHaveLength(1)
      expect(store.cachedMembers[0].userId).toBe(2)
    })
  })

  describe('cached categories', () => {
    it('should add category to cache', () => {
      const store = useProjectDraftStore()

      store.addCachedCategory({ name: 'Bug', color: 'red' })

      expect(store.cachedCategories).toHaveLength(1)
      expect(store.cachedCategories[0]).toEqual({ name: 'Bug', color: 'red' })
    })

    it('should remove category from cache by index', () => {
      const store = useProjectDraftStore()

      store.addCachedCategory({ name: 'Bug', color: 'red' })
      store.addCachedCategory({ name: 'Feature', color: 'blue' })
      store.removeCachedCategory(0)

      expect(store.cachedCategories).toHaveLength(1)
      expect(store.cachedCategories[0].name).toBe('Feature')
    })
  })

  describe('cached columns', () => {
    it('should add column to cache', () => {
      const store = useProjectDraftStore()

      store.addCachedColumn({ title: 'Backlog', taskLimit: 0 })

      expect(store.cachedColumns).toHaveLength(1)
      expect(store.cachedColumns[0]).toEqual({ title: 'Backlog', taskLimit: 0 })
    })

    it('should update column in cache by index', () => {
      const store = useProjectDraftStore()

      store.addCachedColumn({ title: 'Backlog', taskLimit: 0 })
      store.updateCachedColumn(0, { title: 'To Do', taskLimit: 5 })

      expect(store.cachedColumns[0]).toEqual({ title: 'To Do', taskLimit: 5 })
    })

    it('should remove column from cache by index', () => {
      const store = useProjectDraftStore()

      store.addCachedColumn({ title: 'Backlog', taskLimit: 0 })
      store.addCachedColumn({ title: 'Done', taskLimit: 0 })
      store.removeCachedColumn(0)

      expect(store.cachedColumns).toHaveLength(1)
      expect(store.cachedColumns[0].title).toBe('Done')
    })
  })

  describe('cached swimlanes', () => {
    it('should add swimlane to cache', () => {
      const store = useProjectDraftStore()

      store.addCachedSwimlane({ name: 'Sprint 1', description: '' })

      expect(store.cachedSwimlanes).toHaveLength(1)
      expect(store.cachedSwimlanes[0]).toEqual({ name: 'Sprint 1', description: '' })
    })

    it('should remove swimlane from cache by index', () => {
      const store = useProjectDraftStore()

      store.addCachedSwimlane({ name: 'Sprint 1', description: '' })
      store.addCachedSwimlane({ name: 'Sprint 2', description: '' })
      store.removeCachedSwimlane(0)

      expect(store.cachedSwimlanes).toHaveLength(1)
      expect(store.cachedSwimlanes[0].name).toBe('Sprint 2')
    })
  })

  describe('resetDraft', () => {
    it('should reset all draft data', () => {
      const store = useProjectDraftStore()

      store.updateDraft({ name: 'Project', description: 'Desc' })
      store.addCachedMember({ userId: 1, role: 'project-member' })
      store.addCachedCategory({ name: 'Bug', color: 'red' })
      store.addCachedColumn({ title: 'Backlog', taskLimit: 0 })
      store.addCachedSwimlane({ name: 'Sprint 1', description: '' })

      store.resetDraft()

      expect(store.draft.name).toBe('')
      expect(store.draft.description).toBe('')
      expect(store.cachedMembers).toHaveLength(0)
      expect(store.cachedCategories).toHaveLength(0)
      expect(store.cachedColumns).toHaveLength(0)
      expect(store.cachedSwimlanes).toHaveLength(0)
      expect(store.hasDraftData).toBe(false)
    })
  })

  describe('hasCachedData', () => {
    it('should return true when has cached members', () => {
      const store = useProjectDraftStore()
      store.addCachedMember({ userId: 1, role: 'project-member' })
      expect(store.hasCachedData).toBe(true)
    })

    it('should return true when has cached categories', () => {
      const store = useProjectDraftStore()
      store.addCachedCategory({ name: 'Bug', color: 'red' })
      expect(store.hasCachedData).toBe(true)
    })

    it('should return true when has cached columns', () => {
      const store = useProjectDraftStore()
      store.addCachedColumn({ title: 'Backlog', taskLimit: 0 })
      expect(store.hasCachedData).toBe(true)
    })

    it('should return true when has cached swimlanes', () => {
      const store = useProjectDraftStore()
      store.addCachedSwimlane({ name: 'Sprint 1', description: '' })
      expect(store.hasCachedData).toBe(true)
    })

    it('should return false when no cached data', () => {
      const store = useProjectDraftStore()
      expect(store.hasCachedData).toBe(false)
    })
  })
})
