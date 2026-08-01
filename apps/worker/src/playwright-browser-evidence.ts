import { chromium } from 'playwright';
import type { TestIntent, TestIntentCheck } from '@vibeverify/prompting';

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

type CheckEvidence = { title: string; status: 'verified' | 'not_verified'; evidenceIds: string[] };

type PlaywrightBrowserEvidenceDependencies = {
  launch: (options: { headless: true }) => Promise<{
    newPage: () => Promise<BrowserPage>;
    close: () => Promise<void>;
  }>;
};

export function createPlaywrightBrowserEvidence(
  dependencies: PlaywrightBrowserEvidenceDependencies,
) {
  return async (url: string, intent?: TestIntent) => {
    const browser = await dependencies.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const evidence = await inspectLocalHomepage({ page }, url);
      const checks: CheckEvidence[] = [];
      for (const check of intent?.checks ?? []) checks.push(await runCheck(page, check));
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

async function runCheck(page: BrowserPage, check: TestIntentCheck): Promise<CheckEvidence> {
  const evidenceId = check.template;
  try {
    if (check.template === 'homepage') {
      if (!await page.getByText(check.expectedText).isVisible()) throw new Error('TEXT_NOT_VISIBLE');
    } else if (check.template === 'task_list_add') {
      if (check.actionText === undefined) throw new Error('ACTION_TEXT_REQUIRED');
      await page.getByPlaceholder('请输入任务内容').fill(check.actionText);
      await page.getByRole('button', { name: /添加任务/ }).click();
      if (!await page.getByText(check.expectedText).isVisible()) throw new Error('TEXT_NOT_VISIBLE');
    } else if (check.template === 'task_list_blank') {
      if (check.absentText === undefined) throw new Error('ABSENT_TEXT_REQUIRED');
      await page.getByPlaceholder(check.expectedText).fill('');
      await page.getByRole('button', { name: /添加任务/ }).click();
      if (!await page.getByPlaceholder(check.expectedText).isVisible()) throw new Error('INPUT_NOT_VISIBLE');
      if (await page.getByText(check.absentText).isVisible()) throw new Error('UNEXPECTED_TEXT_VISIBLE');
    } else if (check.template === 'task_list_toggle') {
      if (check.actionText === undefined) throw new Error('ACTION_TEXT_REQUIRED');
      await page.getByRole('checkbox', { name: check.actionText }).check();
      if (!await page.getByText(check.expectedText).isVisible()) throw new Error('TEXT_NOT_VISIBLE');
    } else {
      if (check.actionText === undefined) throw new Error('ACTION_TEXT_REQUIRED');
      await page.getByRole('button', { name: check.actionText }).click();
      if (!await page.getByText(check.expectedText).isVisible()) throw new Error('TEXT_NOT_VISIBLE');
      if (check.absentText !== undefined && await page.getByText(check.absentText).isVisible()) throw new Error('UNEXPECTED_TEXT_VISIBLE');
    }
    return { title: check.title, status: 'verified', evidenceIds: [evidenceId] };
  } catch {
    return { title: check.title, status: 'not_verified', evidenceIds: [evidenceId] };
  }
}

export function createDefaultPlaywrightBrowserEvidence() {
  return createPlaywrightBrowserEvidence({
    launch: async (options) => {
      const browser = await chromium.launch(options);
      return {
        newPage: () => browser.newPage(),
        close: () => browser.close(),
      };
    },
  });
}
