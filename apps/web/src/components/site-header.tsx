import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="site-brand" href="/">
        VibeVerify
      </Link>
      <nav aria-label="主导航" className="site-navigation">
        <Link href="/#how-it-works">产品</Link>
        <Link href="/#evidence">证据链</Link>
        <Link href="/login">登录</Link>
        <Link className="site-cta" href="/new">
          开始验收 <span aria-hidden="true">↗</span>
        </Link>
      </nav>
    </header>
  );
}
