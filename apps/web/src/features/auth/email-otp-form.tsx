'use client';

import { ChangeEvent, FormEvent, useState } from 'react';

import { createSupabaseBrowserClient } from '../../lib/supabase/browser-client';
import { requestEmailOtp, verifyEmailOtp } from './email-otp';

export function EmailOtpForm() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [message, setMessage] = useState<string | null>(null);
  async function requestCode(event: FormEvent<HTMLFormElement>) {
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
    const { error } = await requestEmailOtp({ email: email.trim(), auth: supabase.auth });
    if (error !== null) {
      setMessage('暂时无法发送验证码，请稍后重试。');
      return;
    }
    setToken('');
    setStep('verify');
    setMessage(`验证码已发送至 ${email.trim()}，请在下方输入 6 位数字。`);
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(token)) {
      setMessage('请输入邮件中的 6 位数字验证码。');
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (supabase === null) {
      setMessage('认证服务尚未配置。');
      return;
    }
    const { error } = await verifyEmailOtp({ email: email.trim(), token, auth: supabase.auth });
    if (error !== null) {
      setMessage('验证码无效或已过期，请重新发送。');
      return;
    }
    window.location.assign('/new');
  }

  if (step === 'verify') {
    return (
      <EmailOtpVerificationFields
        message={message}
        onSubmit={verifyCode}
        onTokenChange={(event) => setToken(event.target.value)}
        token={token}
      />
    );
  }

  return (
    <form className="demo" onSubmit={requestCode}>
      <label htmlFor="email">邮箱登录</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <button className="primary" type="submit">
        发送验证码
      </button>
      {message === null ? null : <p role="status">{message}</p>}
    </form>
  );
}

export function EmailOtpVerificationFields({
  message,
  onSubmit,
  onTokenChange,
  token,
}: {
  message: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTokenChange: (event: ChangeEvent<HTMLInputElement>) => void;
  token: string;
}) {
  return (
    <form className="demo" onSubmit={onSubmit}>
      <label htmlFor="token">输入 6 位验证码</label>
      <input
        id="token"
        name="token"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        value={token}
        onChange={onTokenChange}
      />
      <button className="primary" type="submit">
        验证并登录
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
