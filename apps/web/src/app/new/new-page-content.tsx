import { NewVerificationForm } from '../../features/jobs/new-verification-form';

export function NewPageContent() {
  return (
    <main className="shell">
      <p className="eyebrow">VibeVerify / 私有工作区</p>
      <h1>新建验收</h1>
      <p className="intro">仅上传用于本次私有验收的项目文件。系统不会在网页服务中运行你的代码。</p>
      <NewVerificationForm />
    </main>
  );
}
