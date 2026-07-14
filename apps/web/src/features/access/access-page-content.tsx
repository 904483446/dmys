import type { ReactNode } from 'react';

export function AccessPageContent({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="shell">
      <p className="eyebrow">VibeVerify / 邀请测试</p>
      <h1>当前为邀请测试阶段</h1>
      <p className="intro">
        请在登录后输入统一内测码。验证成功后，账号将获得私有验收功能访问权限。
      </p>
      {children}
    </main>
  );
}
