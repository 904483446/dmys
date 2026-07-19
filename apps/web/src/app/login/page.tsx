import { EmailOtpForm } from '../../features/auth/email-otp-form';
import { OAuthButtons } from '../../features/auth/oauth-buttons';

export default function LoginPage() {
  return (
    <main className="auth-page login-layout">
      <section className="auth-intro"><p className="eyebrow">VibeVerify / 安全登录</p><h1>登录后开始验收</h1><p className="intro">你的项目仅用于本次私有验收；网页不会执行你的代码。</p></section>
      <section className="auth-panel"><p className="eyebrow">安全登录</p><EmailOtpForm /><OAuthButtons /></section>
    </main>
  );
}
