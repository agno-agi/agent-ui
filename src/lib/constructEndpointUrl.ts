export const constructEndpointUrl = (
  value: string | null | undefined
): string => {
  if (!value) return ''

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return decodeURIComponent(value)
  }

  // Check if the endpoint is localhost or an IP address
  if (
    value.startsWith('localhost') ||
    /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(value)
  ) {
    return `http://${decodeURIComponent(value)}`
  }

  // For all other cases, default to HTTPS
  return `https://${decodeURIComponent(value)}`
}
