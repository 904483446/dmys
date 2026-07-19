import { AppShell } from '../../components/app-shell';
import { NewVerificationForm } from '../../features/jobs/new-verification-form';

export function NewPageContent() {
  return (
    <AppShell title="新建验收">
      <main className="task-layout workspace-page new-workspace">
        <header className="task-intro workspace-heading">
          <p className="eyebrow">验收工作区</p>
          <h1>新建验收</h1>
          <p className="intro">从需求到运行证据，创建一份可复核的验收任务。</p>
          <p>仅上传用于本次私有验收的项目文件。你的代码只在受控 Worker 中处理，网页服务不会执行它。</p>
        </header>
        <section className="task-panel workspace-card">
          <NewVerificationForm />
        </section>
      </main>
    </AppShell>
  );
}
