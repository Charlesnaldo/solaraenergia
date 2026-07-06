export async function createTwoFactorCookieValue(userId: string) {
  return userId;
}

export async function isTwoFactorCookieValid(cookieValue: string | undefined, userId: string | undefined) {
  return Boolean(cookieValue && userId && cookieValue === userId);
}
