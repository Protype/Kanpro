import { describe, it, expect } from 'vitest'
import type {
  User,
  Project,
  Task,
  Column,
  Swimlane,
  Category,
  Subtask,
  Comment,
  TaskFile
} from '@/types'

describe('Type Definitions', () => {
  describe('User', () => {
    it('should have correct structure', () => {
      const user: User = {
        id: 1,
        username: 'admin',
        name: 'Administrator',
        email: 'admin@example.com',
        role: 'app-admin',
        is_active: true
      }

      expect(user.id).toBe(1)
      expect(user.username).toBe('admin')
      expect(user.role).toBe('app-admin')
    })
  })

  describe('Project', () => {
    it('should have correct structure', () => {
      const project: Project = {
        id: 1,
        name: 'Test Project',
        description: 'A test project',
        is_active: true,
        is_public: false,
        is_private: true,
        owner_id: 1
      }

      expect(project.id).toBe(1)
      expect(project.name).toBe('Test Project')
      expect(project.is_active).toBe(true)
    })
  })

  describe('Task', () => {
    it('should have correct structure', () => {
      const task: Task = {
        id: 1,
        title: 'Test Task',
        description: 'Task description',
        project_id: 1,
        column_id: 1,
        swimlane_id: 1,
        position: 1,
        is_active: true,
        color_id: 'blue',
        priority: 0,
        owner_id: 1,
        creator_id: 1,
        date_creation: 1704067200,
        date_modification: 1704067200
      }

      expect(task.id).toBe(1)
      expect(task.title).toBe('Test Task')
      expect(task.project_id).toBe(1)
    })
  })

  describe('Column', () => {
    it('should have correct structure', () => {
      const column: Column = {
        id: 1,
        title: 'Backlog',
        position: 1,
        project_id: 1,
        task_limit: 0,
        description: ''
      }

      expect(column.id).toBe(1)
      expect(column.title).toBe('Backlog')
    })
  })

  describe('Swimlane', () => {
    it('should have correct structure', () => {
      const swimlane: Swimlane = {
        id: 1,
        name: 'Default',
        position: 1,
        is_active: true,
        project_id: 1
      }

      expect(swimlane.id).toBe(1)
      expect(swimlane.name).toBe('Default')
    })
  })

  describe('Category', () => {
    it('should have correct structure', () => {
      const category: Category = {
        id: 1,
        name: 'Bug',
        project_id: 1,
        color_id: 'red'
      }

      expect(category.id).toBe(1)
      expect(category.name).toBe('Bug')
    })
  })

  describe('Subtask', () => {
    it('should have correct structure', () => {
      const subtask: Subtask = {
        id: 1,
        title: 'Subtask 1',
        status: 0,
        task_id: 1,
        user_id: 1,
        position: 1
      }

      expect(subtask.id).toBe(1)
      expect(subtask.title).toBe('Subtask 1')
      expect(subtask.status).toBe(0)
    })
  })

  describe('Comment', () => {
    it('should have correct structure', () => {
      const comment: Comment = {
        id: 1,
        task_id: 1,
        user_id: 1,
        date_creation: 1704067200,
        comment: 'Test comment'
      }

      expect(comment.id).toBe(1)
      expect(comment.comment).toBe('Test comment')
    })
  })

  describe('TaskFile', () => {
    it('should have correct structure', () => {
      const file: TaskFile = {
        id: 1,
        name: 'document.pdf',
        path: '/files/document.pdf',
        is_image: false,
        task_id: 1,
        user_id: 1,
        date: 1704067200,
        size: 1024
      }

      expect(file.id).toBe(1)
      expect(file.name).toBe('document.pdf')
    })
  })
})
