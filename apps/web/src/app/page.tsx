import Link from 'next/link';

import { SiteHeader } from '../components/site-header';

export default function HomePage() {
  return (
    <main className="home-page landing-page">
      <SiteHeader />
      <section className="home-hero landing-hero">
        <div className="home-copy landing-copy">
          <p className="eyebrow landing-kicker">VibeVerify / 私有功能验收</p>
          <h1>
            <span className="landing-title-primary">让 AI 生成的项目，</span>
            <em className="landing-title-accent">可被真实验证。</em>
          </h1>
          <p className="intro">提交目标与项目文件，以真实浏览器运行证据生成可复核的私有验收报告。</p>
          <Link className="primary site-cta" href="/new">
            开始验收 <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <section className="home-preview landing-product-preview" aria-label="固定演示报告">
          <header className="landing-preview-bar">
            <strong>VibeVerify</strong>
            <span>验收报告</span>
          </header>
          <div className="landing-preview-content">
            <p className="eyebrow">验收结论 / 固定演示报告</p>
            <strong>
              有风险 <span>82</span>
            </strong>
            <p>核心流程可访问，但搜索结果为空时缺少明确反馈。</p>
            <dl>
              <div>
                <dt>可信度</dt>
                <dd>高</dd>
              </div>
              <div>
                <dt>已验证</dt>
                <dd>6 / 8</dd>
              </div>
            </dl>
          </div>
        </section>
      </section>
      <section className="home-evidence landing-capabilities" id="how-it-works" aria-label="证据链说明">
        <ol id="evidence">
          <li>
            <strong>目标与验收标准</strong>
            <span>把需求转为可检查的验收条件。</span>
          </li>
          <li>
            <strong>浏览器与运行证据</strong>
            <span>用真实运行结果解释结论来源。</span>
          </li>
          <li>
            <strong>可执行的修复建议</strong>
            <span>明确指出问题和下一步处理方式。</span>
          </li>
        </ol>
      </section>
    </main>
  );
}
