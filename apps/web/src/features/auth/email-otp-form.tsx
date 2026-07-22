'use client';

import { ChangeEvent, FormEvent, useState } from 'react';

import { createSupabaseBrowserClient } from '../../lib/supabase/browser-client';
import { requestEmailOtp } from './email-otp';
import { getOtpSendErrorMessage } from './email-otp-feedback';

export function EmailOtpForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim() === '') {
      setMessage('请输入邮箱地址。');
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (supabase === null) {
      setMessage('认证服务尚未配置。');
      return;
    }

    const { error } = await requestEmailOtp({
      email: email.trim(),
      redirectTo: new URL('/auth/confirm', window.location.origin).toString(),
      auth: supabase.auth,
    });
    if (error !== null) {
      setMessage(getOtpSendErrorMessage(error));
      return;
    }

    setMessage(`登录链接已发送至 ${email.trim()}，请在邮件中打开链接完成登录。`);
  }

  return (
    <EmailMagicLinkRequestFields
      email={email}
      message={message}
      onEmailChange={(event) => setEmail(event.target.value)}
      onSubmit={sendMagicLink}
    />
  );
}

export function EmailMagicLinkRequestFields({
  email,
  message,
  onEmailChange,
  onSubmit,
}: {
  email: string;
  message: string | null;
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="demo" onSubmit={onSubmit}>
      <label htmlFor="email">邮箱登录</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={onEmailChange}
      />
      <button className="primary" type="submit">
        发送登录链接
      </button>
      {message === null ? null : <p role="status">{message}</p>}
    </form>
  );
}
