import { IconType } from '@/components/ui/icon'

const PROVIDER_ICON_MAP: Record<string, IconType> = {
  aws: 'aws',
  openai: 'open-ai',
  anthropic: 'anthropic',
  mistral: 'mistral',
  gemini: 'gemini',
  azure: 'azure',
  groq: 'groq',
  fireworks: 'fireworks',
  deepseek: 'deepseek',
  cohere: 'cohere',
  ollama: 'ollama',
  xai: 'xai'
}

export const getProviderIcon = (provider: string): IconType | null => {
  const normalizedProvider = provider.toLowerCase()
  return (
    Object.entries(PROVIDER_ICON_MAP).find(([key]) =>
      normalizedProvider.includes(key)
    )?.[1] ?? null
  )
}
