'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function AccessForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = new FormData(event.currentTarget).get('code');
    if (typeof code !== 'string' || code.trim() === '') {
      setMessage('请输入内测码');
      return;
    }
    setPending(true);
    setMessage(null);
    const response = await fetch('/api/v1/access/activate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const result = (await response.json()) as { error?: { message?: string } };
    if (!response.ok) {
      setMessage(result.error?.message ?? '暂时无法激活内测权限');
      setPending(false);
      return;
    }
    router.replace('/reports');
    router.refresh();
  }

  return (
    <form className="demo" onSubmit={onSubmit}>
      <label htmlFor="beta-code">内测码</label>
      <input id="beta-code" name="code" type="password" autoComplete="one-time-code" />
      <button className="primary" type="submit" disabled={pending}>
        {pending ? '正在验证…' : '激活访问权限'}
      </button>
      {message === null ? null : <p role="alert">{message}</p>}
    </form>
  );
}
