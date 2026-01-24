import { ref, computed } from 'vue'

// Symbol definitions
export interface SymbolDefinition {
  symbol: string
  name: string
  description: string
  color: string
}

export const SYMBOLS: SymbolDefinition[] = [
  { symbol: '^', name: 'project', description: '選擇專案', color: 'text-blue-500' },
  { symbol: '@', name: 'assignee', description: '指派人員', color: 'text-green-500' },
  { symbol: '#', name: 'tag', description: '標籤', color: 'text-purple-500' },
  { symbol: ':', name: 'column', description: '狀態', color: 'text-orange-500' },
  { symbol: '!', name: 'priority', description: '優先級', color: 'text-red-500' },
  { symbol: '>', name: 'due', description: '到期日', color: 'text-cyan-500' }
]

export interface ParsedSymbol {
  symbol: string
  name: string
  value: string
  startIndex: number
  endIndex: number
}

export interface ParsedInput {
  title: string
  symbols: ParsedSymbol[]
  project?: string
  assignee?: string
  tags: string[]
  column?: string
  priority?: number
  dueDate?: string
}

// Regex pattern to match symbols with their values
// Matches: ^value, @value, #value, :value, !value, >value
// Values can be quoted ("value with spaces") or unquoted (single_word)
const SYMBOL_PATTERN = /([\\^@#:!>])(?:"([^"]+)"|(\S+))/g

/**
 * Parse input string to extract task title and symbol values
 */
export function parseInput(input: string): ParsedInput {
  const result: ParsedInput = {
    title: '',
    symbols: [],
    tags: []
  }

  if (!input.trim()) {
    return result
  }

  let processedInput = input
  const matches: ParsedSymbol[] = []

  // Find all symbol matches
  let match
  while ((match = SYMBOL_PATTERN.exec(input)) !== null) {
    const symbol = match[1]
    const value = match[2] || match[3] // quoted or unquoted
    const symbolDef = SYMBOLS.find(s => s.symbol === symbol)

    if (symbolDef && value) {
      matches.push({
        symbol,
        name: symbolDef.name,
        value,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      })
    }
  }

  // Sort matches by position (descending) to remove from end first
  matches.sort((a, b) => b.startIndex - a.startIndex)

  // Remove symbol patterns from input to get the title
  for (const m of matches) {
    processedInput = processedInput.slice(0, m.startIndex) + processedInput.slice(m.endIndex)
  }

  // Clean up title (trim and remove extra spaces)
  result.title = processedInput.replace(/\s+/g, ' ').trim()

  // Sort matches back by position (ascending) for consistent order
  result.symbols = matches.sort((a, b) => a.startIndex - b.startIndex)

  // Extract specific values
  for (const sym of result.symbols) {
    switch (sym.name) {
      case 'project':
        result.project = sym.value
        break
      case 'assignee':
        result.assignee = sym.value
        break
      case 'tag':
        result.tags.push(sym.value)
        break
      case 'column':
        result.column = sym.value
        break
      case 'priority':
        result.priority = parseInt(sym.value, 10) || undefined
        break
      case 'due':
        result.dueDate = parseDueDate(sym.value)
        break
    }
  }

  return result
}

/**
 * Parse due date string to ISO date format
 */
function parseDueDate(value: string): string | undefined {
  const lower = value.toLowerCase()
  const today = new Date()

  switch (lower) {
    case 'today':
    case '今天':
      return formatDate(today)

    case 'tomorrow':
    case '明天':
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      return formatDate(tomorrow)

    case 'next week':
    case '下週':
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      return formatDate(nextWeek)

    default:
      // Try to parse as date
      const parsed = new Date(value)
      if (!isNaN(parsed.getTime())) {
        return formatDate(parsed)
      }
      // Return as-is if not recognized
      return value
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Get current symbol being typed (for autocomplete)
 */
export function getCurrentSymbol(input: string, cursorPosition: number): {
  symbol: SymbolDefinition | null
  query: string
  startIndex: number
} | null {
  // Look backwards from cursor to find a symbol
  for (let i = cursorPosition - 1; i >= 0; i--) {
    const char = input[i]

    // Check if we hit a space (end of current token)
    if (char === ' ') {
      break
    }

    // Check if this is a symbol character
    const symbolDef = SYMBOLS.find(s => s.symbol === char)
    if (symbolDef) {
      const query = input.slice(i + 1, cursorPosition)
      return {
        symbol: symbolDef,
        query,
        startIndex: i
      }
    }
  }

  return null
}

/**
 * Vue composable for symbol parsing
 */
export function useSymbolParser(initialInput: string = '') {
  const input = ref(initialInput)
  const cursorPosition = ref(0)

  const parsed = computed(() => parseInput(input.value))

  const currentSymbol = computed(() => {
    return getCurrentSymbol(input.value, cursorPosition.value)
  })

  const isTypingSymbol = computed(() => {
    return currentSymbol.value !== null
  })

  const setInput = (value: string) => {
    input.value = value
  }

  const setCursorPosition = (position: number) => {
    cursorPosition.value = position
  }

  const insertValue = (value: string) => {
    if (!currentSymbol.value) return

    const { startIndex, symbol } = currentSymbol.value
    const before = input.value.slice(0, startIndex)
    const after = input.value.slice(cursorPosition.value)

    // If value has spaces, quote it
    const quotedValue = value.includes(' ') ? `"${value}"` : value

    input.value = `${before}${symbol?.symbol}${quotedValue} ${after}`
    cursorPosition.value = startIndex + (symbol?.symbol.length || 0) + quotedValue.length + 1
  }

  return {
    input,
    cursorPosition,
    parsed,
    currentSymbol,
    isTypingSymbol,
    setInput,
    setCursorPosition,
    insertValue
  }
}
