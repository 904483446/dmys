import { EmailOtpForm } from '../../features/auth/email-otp-form';
import { OAuthButtons } from '../../features/auth/oauth-buttons';

export default function LoginPage() {
  return (
    <main className="shell">
      <p className="eyebrow">VibeVerify / 邀请测试</p>
      <h1>登录后开始验收</h1>
      <EmailOtpForm />
      <OAuthButtons />
    </main>
  );
}
