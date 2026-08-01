import { describe, expect, it, vi } from 'vitest';

import { createPlaywrightBrowserEvidence } from './playwright-browser-evidence.js';

describe('createPlaywrightBrowserEvidence', () => {
  it('只采集本地首页，并在采集完成后关闭浏览器', async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const page = {
      on: vi.fn(),
      goto: vi.fn().mockResolvedValue({ status: () => 200 }),
    };
    const launch = vi.fn().mockResolvedValue({ newPage: vi.fn().mockResolvedValue(page), close });
    const collectBrowserEvidence = createPlaywrightBrowserEvidence({ launch });

    await expect(collectBrowserEvidence('http://127.0.0.1:5173')).resolves.toEqual({
      homepageReachable: true,
      evidenceIds: ['homepage-status', 'console-summary'],
      checks: [],
    });
    expect(launch).toHaveBeenCalledWith({ headless: true });
    expect(close).toHaveBeenCalledOnce();
  });

  it('runs only the mapped task-list actions and records one result per check', async () => {
    const locator = {
      fill: vi.fn().mockResolvedValue(undefined),
      click: vi.fn().mockResolvedValue(undefined),
      check: vi.fn().mockResolvedValue(undefined),
      isVisible: vi.fn().mockResolvedValue(true),
    };
    const page = {
      on: vi.fn(),
      goto: vi.fn().mockResolvedValue({ status: () => 200 }),
      getByPlaceholder: vi.fn().mockReturnValue(locator),
      getByRole: vi.fn().mockReturnValue(locator),
      getByText: vi.fn().mockReturnValue(locator),
    };
    const launch = vi.fn().mockResolvedValue({ newPage: vi.fn().mockResolvedValue(page), close: vi.fn() });
    const collectBrowserEvidence = createPlaywrightBrowserEvidence({ launch });

    await expect(collectBrowserEvidence('http://127.0.0.1:5173', {
      checks: [{ template: 'task_list_add', title: '添加任务', actionText: '买牛奶', expectedText: '买牛奶' }],
    })).resolves.toMatchObject({
      evidenceIds: ['homepage-status', 'console-summary', 'task_list_add'],
      checks: [{ title: '添加任务', status: 'verified', evidenceIds: ['task_list_add'] }],
    });
    expect(locator.fill).toHaveBeenCalledWith('买牛奶');
    expect(locator.click).toHaveBeenCalledOnce();
  });

  it('runs stateful task-list checks sequentially on one page', async () => {
    let releaseFirstFill: (() => void) | undefined;
    const firstFill = new Promise<void>((resolve) => { releaseFirstFill = resolve; });
    const fill = vi.fn(async (text: string) => {
      if (text === '任务一') await firstFill;
    });
    const locator = {
      fill,
      click: vi.fn().mockResolvedValue(undefined),
      check: vi.fn().mockResolvedValue(undefined),
      isVisible: vi.fn().mockResolvedValue(true),
    };
    const page = {
      on: vi.fn(), goto: vi.fn().mockResolvedValue({ status: () => 200 }),
      getByPlaceholder: vi.fn().mockReturnValue(locator), getByRole: vi.fn().mockReturnValue(locator), getByText: vi.fn().mockReturnValue(locator),
    };
    const collectBrowserEvidence = createPlaywrightBrowserEvidence({
      launch: vi.fn().mockResolvedValue({ newPage: vi.fn().mockResolvedValue(page), close: vi.fn() }),
    });

    const run = collectBrowserEvidence('http://127.0.0.1:5173', {
      checks: [
        { template: 'task_list_add', title: '添加任务一', actionText: '任务一', expectedText: '任务一' },
        { template: 'task_list_add', title: '添加任务二', actionText: '任务二', expectedText: '任务二' },
      ],
    });
    await vi.waitFor(() => expect(fill).toHaveBeenCalledTimes(1));
    releaseFirstFill?.();
    await expect(run).resolves.toMatchObject({ checks: [{ status: 'verified' }, { status: 'verified' }] });
  });

  it('records a missing assertion as unverified rather than treating the action as passed', async () => {
    const locator = {
      fill: vi.fn().mockResolvedValue(undefined),
      click: vi.fn().mockResolvedValue(undefined),
      check: vi.fn().mockResolvedValue(undefined),
      isVisible: vi.fn().mockResolvedValue(false),
    };
    const page = {
      on: vi.fn(), goto: vi.fn().mockResolvedValue({ status: () => 200 }),
      getByPlaceholder: vi.fn().mockReturnValue(locator), getByRole: vi.fn().mockReturnValue(locator), getByText: vi.fn().mockReturnValue(locator),
    };
    const collectBrowserEvidence = createPlaywrightBrowserEvidence({
      launch: vi.fn().mockResolvedValue({ newPage: vi.fn().mockResolvedValue(page), close: vi.fn() }),
    });

    await expect(collectBrowserEvidence('http://127.0.0.1:5173', {
      checks: [{ template: 'task_list_add', title: '添加任务', actionText: '买牛奶', expectedText: '买牛奶' }],
    })).resolves.toMatchObject({ checks: [{ title: '添加任务', status: 'not_verified' }] });
  });

  it('requires filtering to make one result visible and another result absent', async () => {
    const locator = { fill: vi.fn(), click: vi.fn().mockResolvedValue(undefined), check: vi.fn(), isVisible: vi.fn().mockResolvedValue(true) };
    const page = {
      on: vi.fn(), goto: vi.fn().mockResolvedValue({ status: () => 200 }),
      getByPlaceholder: vi.fn().mockReturnValue(locator), getByRole: vi.fn().mockReturnValue(locator),
      getByText: vi.fn((text: string) => ({ ...locator, isVisible: vi.fn().mockResolvedValue(text !== '待完成任务') })),
    };
    const collectBrowserEvidence = createPlaywrightBrowserEvidence({ launch: vi.fn().mockResolvedValue({ newPage: vi.fn().mockResolvedValue(page), close: vi.fn() }) });

    await expect(collectBrowserEvidence('http://127.0.0.1:5173', {
      checks: [{ template: 'task_list_filter', title: '筛选已完成', actionText: '已完成', expectedText: '完成任务', absentText: '待完成任务' }],
    })).resolves.toMatchObject({ checks: [{ title: '筛选已完成', status: 'verified' }] });
  });
});
