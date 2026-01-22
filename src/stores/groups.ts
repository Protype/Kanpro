import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { Group, User } from '@/types'

export const useGroupsStore = defineStore('groups', () => {
  const groups = ref<Group[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const groupsCount = computed(() => groups.value.length)

  /**
   * 獲取所有群組（需要 admin 權限）
   * 非 admin 用戶會靜默失敗
   */
  async function fetchAllGroups(): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      const result = await client.call<Group[]>('getAllGroups')
      groups.value = result || []
    } catch {
      // getAllGroups 需要 admin 權限，非 admin 用戶靜默失敗
      groups.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function getGroup(groupId: number): Promise<Group | null> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<Group | null>('getGroup', {
      group_id: groupId
    })
    return result
  }

  async function createGroup(name: string, externalId?: string): Promise<number> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const params: { name: string; external_id?: string } = { name }
    if (externalId) {
      params.external_id = externalId
    }

    const result = await client.call<number>('createGroup', params)
    return result
  }

  async function updateGroup(groupId: number, name: string, externalId?: string): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const params: { group_id: number; name: string; external_id?: string } = {
      group_id: groupId,
      name
    }
    if (externalId !== undefined) {
      params.external_id = externalId
    }

    const result = await client.call<boolean>('updateGroup', params)
    return result
  }

  async function removeGroup(groupId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('removeGroup', {
      group_id: groupId
    })
    return result
  }

  async function getGroupMembers(groupId: number): Promise<User[]> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<User[]>('getGroupMembers', {
      group_id: groupId
    })
    return result || []
  }

  async function addGroupMember(groupId: number, userId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('addGroupMember', {
      group_id: groupId,
      user_id: userId
    })
    return result
  }

  async function removeGroupMember(groupId: number, userId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('removeGroupMember', {
      group_id: groupId,
      user_id: userId
    })
    return result
  }

  function clearGroups(): void {
    groups.value = []
    error.value = null
  }

  return {
    groups,
    isLoading,
    error,
    groupsCount,
    fetchAllGroups,
    getGroup,
    createGroup,
    updateGroup,
    removeGroup,
    getGroupMembers,
    addGroupMember,
    removeGroupMember,
    clearGroups
  }
})
