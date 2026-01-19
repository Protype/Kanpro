import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SymbolDropdown from '@/components/SymbolDropdown.vue'
import type { DropdownOption } from '@/composables/useCommandBarDropdown'

describe('SymbolDropdown', () => {
  const mockOptions: DropdownOption[] = [
    { id: 1, label: 'Project Alpha', value: 'Project Alpha', type: 'project' },
    { id: 2, label: 'Project Beta', value: 'Project Beta', type: 'project' },
    { id: 3, label: 'Project Gamma', value: 'Project Gamma', type: 'project' }
  ]

  it('should not render when not visible', () => {
    const wrapper = mount(SymbolDropdown, {
      props: {
        options: mockOptions,
        selectedIndex: 0,
        visible: false,
        symbolType: '^'
      }
    })

    expect(wrapper.find('[data-testid="symbol-dropdown"]').exists()).toBe(false)
  })

  it('should render when visible', () => {
    const wrapper = mount(SymbolDropdown, {
      props: {
        options: mockOptions,
        selectedIndex: 0,
        visible: true,
        symbolType: '^'
      }
    })

    expect(wrapper.find('[data-testid="symbol-dropdown"]').exists()).toBe(true)
  })

  it('should render all options', () => {
    const wrapper = mount(SymbolDropdown, {
      props: {
        options: mockOptions,
        selectedIndex: 0,
        visible: true,
        symbolType: '^'
      }
    })

    const items = wrapper.findAll('[data-testid="dropdown-item"]')
    expect(items).toHaveLength(3)
  })

  it('should highlight the selected option', () => {
    const wrapper = mount(SymbolDropdown, {
      props: {
        options: mockOptions,
        selectedIndex: 1,
        visible: true,
        symbolType: '^'
      }
    })

    const items = wrapper.findAll('[data-testid="dropdown-item"]')
    expect(items[1].classes()).toContain('bg-accent/10')
  })

  it('should emit select event on click', async () => {
    const wrapper = mount(SymbolDropdown, {
      props: {
        options: mockOptions,
        selectedIndex: 0,
        visible: true,
        symbolType: '^'
      }
    })

    const items = wrapper.findAll('[data-testid="dropdown-item"]')
    await items[1].trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual([mockOptions[1]])
  })

  it('should show empty message when no options and not canCreateNew', () => {
    const wrapper = mount(SymbolDropdown, {
      props: {
        options: [],
        selectedIndex: 0,
        visible: true,
        symbolType: '^',
        emptyMessage: '無符合的專案'
      }
    })

    expect(wrapper.find('[data-testid="empty-message"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('無符合的專案')
  })

  it('should not show dropdown when canCreateNew and no options', () => {
    const wrapper = mount(SymbolDropdown, {
      props: {
        options: [],
        selectedIndex: 0,
        visible: true,
        symbolType: '#',
        canCreateNew: true,
        emptyMessage: ''
      }
    })

    // When canCreateNew is true and no options, should not show the dropdown
    expect(wrapper.find('[data-testid="empty-message"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="symbol-dropdown"]').exists()).toBe(false)
  })

  it('should apply correct color class based on symbol type', () => {
    const wrapper = mount(SymbolDropdown, {
      props: {
        options: mockOptions,
        selectedIndex: 0,
        visible: true,
        symbolType: '@'
      }
    })

    // Check that the component has rendered with the correct type
    expect(wrapper.props('symbolType')).toBe('@')
  })

  describe('symbol type colors', () => {
    const colorTestCases = [
      { symbol: '^', expectedClass: 'border-blue-500' },
      { symbol: '@', expectedClass: 'border-green-500' },
      { symbol: '#', expectedClass: 'border-purple-500' },
      { symbol: ':', expectedClass: 'border-orange-500' },
      { symbol: '!', expectedClass: 'border-red-500' },
      { symbol: '>', expectedClass: 'border-cyan-500' }
    ]

    colorTestCases.forEach(({ symbol, expectedClass }) => {
      it(`should have ${expectedClass} border for ${symbol} symbol`, () => {
        const wrapper = mount(SymbolDropdown, {
          props: {
            options: mockOptions,
            selectedIndex: 0,
            visible: true,
            symbolType: symbol
          }
        })

        const dropdown = wrapper.find('[data-testid="symbol-dropdown"]')
        expect(dropdown.classes()).toContain(expectedClass)
      })
    })
  })
})
