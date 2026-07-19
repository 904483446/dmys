import { NewVerificationForm } from '../../features/jobs/new-verification-form';

export function NewPageContent() {
  return (
    <main className="task-layout">
      <section className="task-intro"><p className="eyebrow">VibeVerify / 私有工作区</p><h1>新建验收</h1><p className="intro">从需求到运行证据，创建一份可复核的验收任务。</p><p>仅上传用于本次私有验收的项目文件。你的代码只在受控 Worker 中处理，网页服务不会执行它。</p></section>
      <section className="task-panel"><NewVerificationForm /></section>
    </main>
  );
}
