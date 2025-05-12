export function getUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const userId = params.get('user_id');

  if (!userId) {
    window.location.href = `${process.env.NEXT_PUBLIC_AUTH_APP_URL}/auth/login`;
    return null;
  }

  return userId
}
