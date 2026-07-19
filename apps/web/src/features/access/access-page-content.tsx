import type { ReactNode } from 'react';

import { SiteHeader } from '../../components/site-header';

export function AccessPageContent({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="auth-page auth-saas-layout access-layout">
      <SiteHeader />
      <section className="auth-saas-content">
        <section className="auth-intro auth-copy">
          <p className="eyebrow">VibeVerify / 仅限受邀用户</p>
          <h1><span className="auth-title-primary">当前为邀请</span><span className="auth-title-secondary">测试阶段</span></h1>
          <p className="intro">请在登录后输入统一内测码。验证成功后，账号将获得私有验收功能访问权限。</p>
        </section>
        <section className="auth-panel auth-card">
          <p className="eyebrow">仅限受邀用户</p>
          {children}
        </section>
      </section>
    </main>
  );
}
