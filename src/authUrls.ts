export function buildOwnerSwitchUrl(origin: string): string {
  const appUrl = new URL('/', origin);
  const loginUrl = new URL('/.auth/login/aad', origin);
  loginUrl.searchParams.set('post_login_redirect_uri', appUrl.toString());

  const logoutUrl = new URL('/.auth/logout', origin);
  logoutUrl.searchParams.set('post_logout_redirect_uri', loginUrl.toString());
  return logoutUrl.toString();
}