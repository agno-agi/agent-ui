export type TextDirection = 'rtl' | 'ltr'

const RTL_SCRIPT_REGEX =
  /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u0870-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

const LTR_SCRIPT_REGEX = /[A-Za-z\u00C0-\u024F]/

const stripBidiControls = (text: string) =>
  text.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')

export const splitLines = (text: string): string[] => text.split(/\r?\n/)

export const getTextDirection = (text: string): TextDirection => {
  const normalizedText = stripBidiControls(text)

  for (const char of normalizedText) {
    if (RTL_SCRIPT_REGEX.test(char)) {
      return 'rtl'
    }

    if (LTR_SCRIPT_REGEX.test(char)) {
      return 'ltr'
    }
  }

  return 'ltr'
}
