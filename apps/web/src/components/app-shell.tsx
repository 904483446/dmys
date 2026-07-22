import type { ReactNode } from 'react';
import Link from 'next/link';

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const isNew = title === '新建验收';
  const isReports = title === '我的报告';

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="app-brand" href="/">
          VibeVerify
        </Link>
        <nav aria-label="工作台导航" className="app-navigation">
          <Link className={isNew ? 'app-navigation-active' : undefined} href="/new">
            新建验收
          </Link>
          <Link className={isReports ? 'app-navigation-active' : undefined} href="/reports">
            验收报告
          </Link>
        </nav>
      </aside>
      <main className="app-main">
        <header className="app-topbar">
          <span>工作区 / {title}</span>
        </header>
        {children}
      </main>
    </div>
  );
}
