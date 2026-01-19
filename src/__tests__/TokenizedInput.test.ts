import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TokenizedInput from '@/components/TokenizedInput.vue'
import type { InputToken } from '@/components/TokenizedInput.vue'

describe('TokenizedInput', () => {
  const mockTokens: InputToken[] = [
    { type: 'symbol', symbol: '^', value: 'Project Alpha', display: 'Project Alpha' },
    { type: 'symbol', symbol: '@', value: 'john', display: 'John Doe' }
  ]

  describe('rendering', () => {
    it('should render the input field', () => {
      const wrapper = mount(TokenizedInput, {
        props: {
          tokens: [],
          textInput: '',
          placeholder: 'Enter text...'
        }
      })

      expect(wrapper.find('input').exists()).toBe(true)
    })

    it('should render tokens as pills', () => {
      const wrapper = mount(TokenizedInput, {
        props: {
          tokens: mockTokens,
          textInput: '',
          placeholder: ''
        }
      })

      const pills = wrapper.findAll('[data-testid="token-pill"]')
      expect(pills).toHaveLength(2)
    })

    it('should display token value in pill', () => {
      const wrapper = mount(TokenizedInput, {
        props: {
          tokens: mockTokens,
          textInput: '',
          placeholder: ''
        }
      })

      const pills = wrapper.findAll('[data-testid="token-pill"]')
      expect(pills[0].text()).toContain('Project Alpha')
      expect(pills[1].text()).toContain('John Doe')
    })

    it('should show placeholder when no tokens and no text', () => {
      const wrapper = mount(TokenizedInput, {
        props: {
          tokens: [],
          textInput: '',
          placeholder: 'Enter text...'
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('placeholder')).toBe('Enter text...')
    })
  })

  describe('token colors', () => {
    const colorTestCases = [
      { symbol: '^', expectedClass: 'bg-blue-100' },
      { symbol: '@', expectedClass: 'bg-green-100' },
      { symbol: '#', expectedClass: 'bg-purple-100' },
      { symbol: ':', expectedClass: 'bg-orange-100' },
      { symbol: '!', expectedClass: 'bg-red-100' },
      { symbol: '>', expectedClass: 'bg-cyan-100' }
    ]

    colorTestCases.forEach(({ symbol, expectedClass }) => {
      it(`should have ${expectedClass} for ${symbol} symbol`, () => {
        const wrapper = mount(TokenizedInput, {
          props: {
            tokens: [{ type: 'symbol', symbol, value: 'test', display: 'Test' }],
            textInput: '',
            placeholder: ''
          }
        })

        const pill = wrapper.find('[data-testid="token-pill"]')
        expect(pill.classes()).toContain(expectedClass)
      })
    })
  })

  describe('events', () => {
    it('should emit update:textInput on input change', async () => {
      const wrapper = mount(TokenizedInput, {
        props: {
          tokens: [],
          textInput: '',
          placeholder: ''
        }
      })

      const input = wrapper.find('input')
      await input.setValue('Hello')

      expect(wrapper.emitted('update:textInput')).toBeTruthy()
      expect(wrapper.emitted('update:textInput')![0]).toEqual(['Hello'])
    })

    it('should emit removeToken when backspace is pressed with cursor at start and tokens exist', async () => {
      const wrapper = mount(TokenizedInput, {
        props: {
          tokens: mockTokens,
          textInput: '',
          placeholder: ''
        }
      })

      const input = wrapper.find('input')
      // Simulate backspace with cursor at position 0
      await input.trigger('keydown', { key: 'Backspace' })

      expect(wrapper.emitted('removeToken')).toBeTruthy()
      expect(wrapper.emitted('removeToken')![0]).toEqual([1]) // Last token index
    })

    it('should not emit removeToken when text exists before cursor', async () => {
      const wrapper = mount(TokenizedInput, {
        props: {
          tokens: mockTokens,
          textInput: 'some text',
          placeholder: ''
        }
      })

      const input = wrapper.find('input')
      // Set selection start to simulate cursor in middle of text
      const inputEl = input.element as HTMLInputElement
      inputEl.setSelectionRange(5, 5)

      await input.trigger('keydown', { key: 'Backspace' })

      expect(wrapper.emitted('removeToken')).toBeFalsy()
    })

    it('should emit cursorChange on input click', async () => {
      const wrapper = mount(TokenizedInput, {
        props: {
          tokens: [],
          textInput: 'test',
          placeholder: ''
        }
      })

      const input = wrapper.find('input')
      await input.trigger('click')

      expect(wrapper.emitted('cursorChange')).toBeTruthy()
    })

    it('should emit submit on Enter key', async () => {
      const wrapper = mount(TokenizedInput, {
        props: {
          tokens: [],
          textInput: 'test task',
          placeholder: ''
        }
      })

      const input = wrapper.find('input')
      await input.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('submit')).toBeTruthy()
    })

    it('should emit close on Escape key', async () => {
      const wrapper = mount(TokenizedInput, {
        props: {
          tokens: [],
          textInput: '',
          placeholder: ''
        }
      })

      const input = wrapper.find('input')
      await input.trigger('keydown', { key: 'Escape' })

      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('focus management', () => {
    it('should focus input when focus method is called', async () => {
      const wrapper = mount(TokenizedInput, {
        props: {
          tokens: [],
          textInput: '',
          placeholder: ''
        },
        attachTo: document.body
      })

      const component = wrapper.vm as any
      component.focus()

      await wrapper.vm.$nextTick()

      expect(document.activeElement).toBe(wrapper.find('input').element)

      wrapper.unmount()
    })
  })

  describe('pill removal', () => {
    it('should emit removeToken when pill close button is clicked', async () => {
      const wrapper = mount(TokenizedInput, {
        props: {
          tokens: mockTokens,
          textInput: '',
          placeholder: ''
        }
      })

      const closeButtons = wrapper.findAll('[data-testid="token-remove"]')
      await closeButtons[0].trigger('click')

      expect(wrapper.emitted('removeToken')).toBeTruthy()
      expect(wrapper.emitted('removeToken')![0]).toEqual([0])
    })
  })

  describe('disabled state', () => {
    it('should disable input when disabled prop is true', () => {
      const wrapper = mount(TokenizedInput, {
        props: {
          tokens: [],
          textInput: '',
          placeholder: '',
          disabled: true
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('disabled')).toBeDefined()
    })
  })
})
