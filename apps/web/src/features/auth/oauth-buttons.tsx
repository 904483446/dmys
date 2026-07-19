'use client';

import { useState } from 'react';

import { createSupabaseBrowserClient } from '../../lib/supabase/browser-client';
import { createOtpRedirectUrl } from './otp-redirect-url';

type Provider = 'google' | 'github';

export function OAuthButtons() {
  const [message, setMessage] = useState<string | null>(null);

  async function signIn(provider: Provider) {
    const supabase = createSupabaseBrowserClient();
    if (supabase === null) {
      setMessage('认证服务尚未配置');
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: createOtpRedirectUrl(window.location.origin) },
    });
    if (error !== null) setMessage('暂时无法发起登录，请稍后重试。');
  }

  return (
    <section className="demo auth-oauth-options" aria-label="第三方登录">
      <span className="auth-oauth-separator" aria-hidden="true" />
      <button type="button" onClick={() => signIn('google')}>
        使用 Google 登录
      </button>
      <button type="button" onClick={() => signIn('github')}>
        使用 GitHub 登录
      </button>
      {message === null ? null : <p role="alert">{message}</p>}
    </section>
  );
}
