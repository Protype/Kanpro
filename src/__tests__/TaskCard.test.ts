import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskCard from '@/components/TaskCard.vue'
import UserAvatar from '@/components/UserAvatar.vue'

// Mock PhIcon component
const PhIcon = {
  name: 'PhIcon',
  props: ['icon'],
  template: '<span :data-icon="icon"></span>'
}

describe('TaskCard', () => {
  const baseTask = {
    id: 1,
    title: 'Test Task',
    color_id: 'blue',
    column_id: 1,
    project_id: 1,
    position: 1,
    is_active: 1,
    date_creation: 1704067200,
    date_modification: 1704067200
  }

  function mountCard(task = baseTask) {
    return mount(TaskCard, {
      props: { task },
      global: {
        stubs: {
          PhIcon,
          UserAvatar: true
        }
      }
    })
  }

  describe('assignee avatar', () => {
    it('should use UserAvatar component when owner is assigned', () => {
      const task = {
        ...baseTask,
        owner_id: 1,
        owner_name: 'John Doe',
        owner_username: 'johndoe'
      }
      const wrapper = mountCard(task)

      const avatar = wrapper.findComponent({ name: 'UserAvatar' })
      expect(avatar.exists()).toBe(true)
    })

    it('should pass owner data to UserAvatar', () => {
      const task = {
        ...baseTask,
        owner_id: 1,
        owner_name: 'John Doe',
        owner_username: 'johndoe'
      }
      const wrapper = mountCard(task)

      const avatar = wrapper.findComponent({ name: 'UserAvatar' })
      expect(avatar.props('name')).toBe('John Doe')
    })

    it('should use owner_username when owner_name is not available', () => {
      const task = {
        ...baseTask,
        owner_id: 1,
        owner_username: 'johndoe'
      }
      const wrapper = mountCard(task)

      const avatar = wrapper.findComponent({ name: 'UserAvatar' })
      expect(avatar.props('name')).toBe('johndoe')
    })

    it('should not render UserAvatar when no owner is assigned', () => {
      const wrapper = mountCard(baseTask)

      const avatar = wrapper.findComponent({ name: 'UserAvatar' })
      expect(avatar.exists()).toBe(false)
    })

    it('should use xs size for avatar in card', () => {
      const task = {
        ...baseTask,
        owner_id: 1,
        owner_name: 'John Doe'
      }
      const wrapper = mountCard(task)

      const avatar = wrapper.findComponent({ name: 'UserAvatar' })
      expect(avatar.props('size')).toBe('xs')
    })
  })
})
