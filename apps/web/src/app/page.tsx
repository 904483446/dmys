import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="shell">
      <p className="eyebrow">VibeVerify / 私有功能验收</p>
      <h1>
        让 AI 生成的项目，<em>可被真实验证。</em>
      </h1>
      <p className="intro">提交你的目标与项目，由真实浏览器运行证据生成私有验收报告。</p>
      <Link className="primary" href="/new">
        新建验收
      </Link>
      <section className="demo" aria-label="固定演示报告">
        <p>固定演示报告</p>
        <strong>有风险 · 82 分</strong>
        <span>已验证首页访问；建议补充搜索结果为空时的提示。</span>
      </section>
    </main>
  );
}
