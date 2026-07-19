import { SiteHeader } from '../../components/site-header';
import { EmailOtpForm } from '../../features/auth/email-otp-form';
import { OAuthButtons } from '../../features/auth/oauth-buttons';

export default function LoginPage() {
  return (
    <main className="auth-page auth-saas-layout login-layout">
      <SiteHeader />
      <section className="auth-saas-content">
        <section className="auth-intro auth-copy">
          <p className="eyebrow">VibeVerify / 安全登录</p>
          <h1><span className="auth-title-primary">登录后开始</span><span className="auth-title-secondary">验收</span></h1>
          <p className="intro">你的项目仅用于本次私有验收；网页不会执行你的代码。</p>
        </section>
        <section className="auth-panel auth-card">
          <p className="eyebrow">安全登录</p>
          <EmailOtpForm />
          <OAuthButtons />
        </section>
      </section>
    </main>
  );
}
