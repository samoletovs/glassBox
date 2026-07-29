import { describe, expect, it } from 'vitest';
import { buildOwnerSwitchUrl } from './authUrls';

describe('buildOwnerSwitchUrl', () => {
  it('should log out before returning through Entra login', () => {
    const switchUrl = new URL(buildOwnerSwitchUrl('https://glassbox.naurolabs.com'));
    const loginUrl = new URL(switchUrl.searchParams.get('post_logout_redirect_uri') ?? '');

    expect(switchUrl.pathname).toBe('/.auth/logout');
    expect(loginUrl.pathname).toBe('/.auth/login/aad');
    expect(loginUrl.searchParams.get('post_login_redirect_uri')).toBe(
      'https://glassbox.naurolabs.com/',
    );
  });
});