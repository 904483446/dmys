'use client';

import { FormEvent, useState } from 'react';

import { createOtpRedirectUrl } from './otp-redirect-url';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser-client';

export function EmailOtpForm() {
  const [message, setMessage] = useState<string | null>(null);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email');
    if (typeof email !== 'string' || email.trim() === '') {
      setMessage('请输入邮箱地址');
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (supabase === null) {
      setMessage('认证服务尚未配置');
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: createOtpRedirectUrl(window.location.origin) },
    });
    setMessage(error === null ? '验证码已发送，请查收邮箱。' : '暂时无法发送验证码，请稍后重试。');
  }
  return (
    <form className="demo" onSubmit={onSubmit}>
      <label htmlFor="email">邮箱验证码</label>
      <input id="email" name="email" type="email" autoComplete="email" />
      <button className="primary" type="submit">
        发送验证码
      </button>
      {message === null ? null : <p role="status">{message}</p>}
    </form>
  );
}
