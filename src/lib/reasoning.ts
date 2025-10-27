const THINK_OPEN_TAG = '<think>'
const THINK_CLOSE_TAG = '</think>'

export interface ParsedReasoning {
  visibleContent: string
  reasoningText: string | null
  badges: string[]
  isComplete: boolean
}

const sanitizeBadge = (text: string) =>
  text
    .replace(/^[\d\W]+/, '')
    .replace(/[`*_#>\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const buildBadgesFromReasoning = (reasoningText: string): string[] => {
  const normalized = reasoningText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  const segments =
    normalized.length > 0
      ? normalized
      : reasoningText
          .split(/(?<=[.!?])\s+/)
          .map((segment) => segment.trim())
          .filter(Boolean)

  return segments
    .map((segment) => sanitizeBadge(segment))
    .filter(Boolean)
    .map((segment) =>
      segment.length > 80 ? `${segment.slice(0, 77)}…` : segment
    )
}

export const parseReasoningContent = (rawContent: string): ParsedReasoning => {
  if (!rawContent.includes(THINK_OPEN_TAG)) {
    return {
      visibleContent: rawContent,
      reasoningText: null,
      badges: [],
      isComplete: true
    }
  }

  const startIndex = rawContent.indexOf(THINK_OPEN_TAG)
  const endIndex = rawContent.indexOf(THINK_CLOSE_TAG)
  const beforeReasoning = rawContent.slice(0, startIndex)

  if (endIndex === -1) {
    const partialReasoning = rawContent.slice(startIndex + THINK_OPEN_TAG.length)
    const badges = buildBadgesFromReasoning(partialReasoning)
    return {
      visibleContent: beforeReasoning,
      reasoningText: partialReasoning,
      badges,
      isComplete: false
    }
  }

  const reasoningText = rawContent.slice(
    startIndex + THINK_OPEN_TAG.length,
    endIndex
  )
  const afterReasoning = rawContent.slice(endIndex + THINK_CLOSE_TAG.length)
  const visibleContent = `${beforeReasoning}${afterReasoning}`
  const badges = buildBadgesFromReasoning(reasoningText)

  return {
    visibleContent,
    reasoningText,
    badges,
    isComplete: true
  }
}
