import { chromium } from 'playwright';

import { inspectLocalHomepage } from './browser-evidence.js';

type BrowserPage = {
  on: (event: 'console', listener: (message: { type: () => string }) => void) => void;
  goto: (url: string) => Promise<{ status: () => number } | null>;
};

type PlaywrightBrowserEvidenceDependencies = {
  launch: (options: { headless: true }) => Promise<{
    newPage: () => Promise<BrowserPage>;
    close: () => Promise<void>;
  }>;
};

export function createPlaywrightBrowserEvidence(
  dependencies: PlaywrightBrowserEvidenceDependencies,
) {
  return async (url: string) => {
    const browser = await dependencies.launch({ headless: true });
    try {
      const evidence = await inspectLocalHomepage({ page: await browser.newPage() }, url);
      return {
        homepageReachable: evidence.homepageReachable,
        evidenceIds: ['homepage-status', 'console-summary'],
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
      return {
        newPage: () => browser.newPage(),
        close: () => browser.close(),
      };
    },
  });
}
