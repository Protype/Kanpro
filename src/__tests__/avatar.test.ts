import { describe, it, expect } from 'vitest'
import { getAvatarColor, getAvatarInitial, getUserDisplayName } from '@/utils/avatar'
import type { ProjectMember } from '@/types'

describe('Avatar Utilities', () => {
  describe('getAvatarColor', () => {
    it('should return a consistent color for the same name', () => {
      const color1 = getAvatarColor('John Doe')
      const color2 = getAvatarColor('John Doe')
      expect(color1).toBe(color2)
    })

    it('should return different colors for different names', () => {
      const color1 = getAvatarColor('John Doe')
      const color2 = getAvatarColor('Jane Smith')
      expect(color1).not.toBe(color2)
    })

    it('should return HSL format', () => {
      const color = getAvatarColor('Test User')
      expect(color).toMatch(/^hsl\(\d+, 65%, 45%\)$/)
    })

    it('should return gray for empty string', () => {
      const color = getAvatarColor('')
      expect(color).toBe('hsl(0, 0%, 50%)')
    })

    it('should handle unicode characters', () => {
      const color = getAvatarColor('張三')
      expect(color).toMatch(/^hsl\(\d+, 65%, 45%\)$/)
    })

    it('should generate hue in valid range (0-359)', () => {
      const testNames = ['Alice', 'Bob', 'Charlie', 'David', '愛麗絲', '鮑伯']
      for (const name of testNames) {
        const color = getAvatarColor(name)
        const match = color.match(/hsl\((\d+),/)
        if (match) {
          const hue = parseInt(match[1])
          expect(hue).toBeGreaterThanOrEqual(0)
          expect(hue).toBeLessThan(360)
        }
      }
    })
  })

  describe('getAvatarInitial', () => {
    it('should return first character uppercase', () => {
      expect(getAvatarInitial('john')).toBe('J')
      expect(getAvatarInitial('John')).toBe('J')
    })

    it('should return ? for null or undefined', () => {
      expect(getAvatarInitial(null)).toBe('?')
      expect(getAvatarInitial(undefined)).toBe('?')
    })

    it('should return ? for empty string', () => {
      expect(getAvatarInitial('')).toBe('?')
    })

    it('should handle unicode characters', () => {
      expect(getAvatarInitial('張三')).toBe('張')
    })

    it('should handle single character', () => {
      expect(getAvatarInitial('A')).toBe('A')
    })
  })

  describe('getUserDisplayName', () => {
    it('should prefer name over username', () => {
      expect(getUserDisplayName({ name: 'John Doe', username: 'john' })).toBe('John Doe')
    })

    it('should use username when name is null', () => {
      expect(getUserDisplayName({ name: null, username: 'john' })).toBe('john')
    })

    it('should use username when name is empty', () => {
      expect(getUserDisplayName({ name: '', username: 'john' })).toBe('john')
    })

    it('should return empty string for null user', () => {
      expect(getUserDisplayName(null)).toBe('')
    })

    it('should return empty string for undefined user', () => {
      expect(getUserDisplayName(undefined)).toBe('')
    })

    it('should return empty string when both name and username are missing', () => {
      expect(getUserDisplayName({})).toBe('')
    })
  })

  describe('ProjectMember with avatar', () => {
    it('should support avatar field in ProjectMember', () => {
      const member: ProjectMember = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        role: 'project-member',
        is_active: true,
        avatar: 'base64encodedimage'
      }

      expect(member.avatar).toBe('base64encodedimage')
      expect(getUserDisplayName(member)).toBe('Test User')
      expect(getAvatarInitial(getUserDisplayName(member))).toBe('T')
    })

    it('should handle null avatar in ProjectMember', () => {
      const member: ProjectMember = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: null,
        role: 'project-member',
        is_active: true,
        avatar: null
      }

      expect(member.avatar).toBeNull()
    })

    it('should handle undefined avatar in ProjectMember', () => {
      const member: ProjectMember = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: null,
        role: 'project-member',
        is_active: true
        // avatar is optional and not provided
      }

      expect(member.avatar).toBeUndefined()
    })
  })
})
