import { chromium } from 'playwright';
import type { AcceptanceCriterion, AcceptancePlan, SemanticStep } from '@vibeverify/prompting';

import { inspectLocalHomepage } from './browser-evidence.js';

type BrowserPage = {
  on: (event: 'console', listener: (message: { type: () => string }) => void) => void;
  goto: (url: string) => Promise<{ status: () => number } | null>;
  getByPlaceholder: (text: string) => BrowserLocator;
  getByRole: (role: 'button' | 'checkbox', options: { name: string | RegExp }) => BrowserLocator;
  getByText: (text: string) => BrowserLocator;
};

type BrowserLocator = {
  fill: (text: string) => Promise<void>;
  click: () => Promise<void>;
  check: () => Promise<void>;
  isVisible: () => Promise<boolean>;
};

export type CheckEvidence = {
  title: string;
  sourceRequirement: string;
  detail: string;
  status: 'verified' | 'not_verified';
  evidenceIds: string[];
};

type PlaywrightBrowserEvidenceDependencies = {
  launch: (options: { headless: true }) => Promise<{
    newPage: () => Promise<BrowserPage>;
    close: () => Promise<void>;
  }>;
};

function summarizeStep(step: SemanticStep): string {
  if (step.kind === 'fill_input') return `填写“${step.placeholder}”：${step.value}`;
  if (step.kind === 'click_button') return `点击“${step.name}”`;
  if (step.kind === 'check_checkbox') return `勾选“${step.name}”`;
  if (step.kind === 'assert_text_visible') return `确认“${step.text}”可见`;
  return `确认“${step.text}”不可见`;
}

async function runStep(page: BrowserPage, step: SemanticStep): Promise<void> {
  if (step.kind === 'fill_input') return page.getByPlaceholder(step.placeholder).fill(step.value);
  if (step.kind === 'click_button') return page.getByRole('button', { name: step.name }).click();
  if (step.kind === 'check_checkbox') return page.getByRole('checkbox', { name: step.name }).check();
  if (step.kind === 'assert_text_visible' && !await page.getByText(step.text).isVisible()) throw new Error('TEXT_NOT_VISIBLE');
  if (step.kind === 'assert_text_hidden' && await page.getByText(step.text).isVisible()) throw new Error('TEXT_UNEXPECTEDLY_VISIBLE');
}

async function runCriterion(page: BrowserPage, criterion: AcceptanceCriterion): Promise<CheckEvidence> {
  const completed: string[] = [];
  try {
    for (const step of criterion.steps) {
      await runStep(page, step);
      completed.push(summarizeStep(step));
    }
    return {
      title: criterion.title,
      sourceRequirement: criterion.sourceRequirement,
      detail: completed.join('；'),
      status: 'verified',
      evidenceIds: [`criterion-${criterion.id}`],
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'UNKNOWN_STEP_FAILURE';
    return {
      title: criterion.title,
      sourceRequirement: criterion.sourceRequirement,
      detail: [...completed, `步骤失败：${reason}`].join('；'),
      status: 'not_verified',
      evidenceIds: [`criterion-${criterion.id}`],
    };
  }
}

export function createPlaywrightBrowserEvidence(dependencies: PlaywrightBrowserEvidenceDependencies) {
  return async (url: string, plan?: AcceptancePlan) => {
    const browser = await dependencies.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const evidence = await inspectLocalHomepage({ page }, url);
      const checks: CheckEvidence[] = [];
      for (const criterion of plan?.criteria ?? []) checks.push(await runCriterion(page, criterion));
      return {
        homepageReachable: evidence.homepageReachable,
        evidenceIds: ['homepage-status', 'console-summary', ...checks.flatMap((check) => check.evidenceIds)],
        checks,
      };
    } finally {
      await browser.close();
    }
  };
}

export function createDefaultPlaywrightBrowserEvidence() {
  return createPlaywrightBrowserEvidence({
    launch: async (options) => {
      const browser = await chromium.launch(options);
      return { newPage: () => browser.newPage(), close: () => browser.close() };
    },
  });
}
