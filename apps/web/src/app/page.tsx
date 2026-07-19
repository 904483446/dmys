import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-copy">
          <p className="eyebrow">VibeVerify / 私有功能验收</p>
          <h1>让 AI 生成的项目，<em>可被真实验证。</em></h1>
          <p className="intro">提交目标与项目文件，以真实浏览器运行证据生成可复核的私有验收报告。</p>
          <Link className="primary" href="/new">开始验收</Link>
        </div>
        <section className="home-preview" aria-label="固定演示报告">
          <p className="eyebrow">验收结论 / 固定演示报告</p>
          <strong>有风险 <span>82</span></strong>
          <p>核心流程可访问，但搜索结果为空时缺少明确反馈。</p>
          <dl><div><dt>可信度</dt><dd>高</dd></div><div><dt>已验证</dt><dd>6 / 8</dd></div></dl>
        </section>
      </section>
      <section className="home-evidence" aria-label="证据链说明">
        <p className="eyebrow">证据链</p>
        <h2>不是“看起来完成”，而是每项结论都有可回看的依据。</h2>
        <ol><li>目标与验收标准</li><li>浏览器与运行证据</li><li>可执行的修复建议</li></ol>
      </section>
    </main>
  );
}
