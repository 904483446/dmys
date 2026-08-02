import { describe, expect, it, vi } from 'vitest';

import { createPlaywrightBrowserEvidence } from './playwright-browser-evidence.js';

describe('createPlaywrightBrowserEvidence', () => {
  it('collects only homepage evidence when the plan has no executable criteria', async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const page = { on: vi.fn(), goto: vi.fn().mockResolvedValue({ status: () => 200 }) };
    const collect = createPlaywrightBrowserEvidence({ launch: vi.fn().mockResolvedValue({ newPage: vi.fn().mockResolvedValue(page), close }) });

    await expect(collect('http://127.0.0.1:5173', { criteria: [], manualReview: [] } as never)).resolves.toMatchObject({
      homepageReachable: true, checks: [], evidenceIds: ['homepage-status', 'console-summary'],
    });
    expect(close).toHaveBeenCalledOnce();
  });

  it('executes a user-derived semantic criterion and records its action summary', async () => {
    const fill = vi.fn().mockResolvedValue(undefined);
    const click = vi.fn().mockResolvedValue(undefined);
    const locator = { fill, click, check: vi.fn(), isVisible: vi.fn().mockResolvedValue(true) };
    const page = {
      on: vi.fn(), goto: vi.fn().mockResolvedValue({ status: () => 200 }),
      getByPlaceholder: vi.fn().mockReturnValue(locator), getByRole: vi.fn().mockReturnValue(locator), getByText: vi.fn().mockReturnValue(locator),
    };
    const collect = createPlaywrightBrowserEvidence({ launch: vi.fn().mockResolvedValue({ newPage: vi.fn().mockResolvedValue(page), close: vi.fn() }) });

    await expect(collect('http://127.0.0.1:5173', {
      criteria: [{
        id: 'add-book', title: '添加《三体》', sourceRequirement: '在“书名”填写“三体”后点击“新增”',
        steps: [
          { kind: 'fill_input', placeholder: '书名', value: '三体' },
          { kind: 'click_button', name: '新增' },
          { kind: 'assert_text_visible', text: '三体' },
        ],
      }], manualReview: [],
    } as never)).resolves.toMatchObject({
      checks: [{
        title: '添加《三体》', sourceRequirement: '在“书名”填写“三体”后点击“新增”',
        detail: '填写“书名”：三体；点击“新增”；确认“三体”可见', status: 'verified',
      }],
    });
    expect(fill).toHaveBeenCalledWith('三体');
    expect(click).toHaveBeenCalledOnce();
  });

  it('marks only the failed criterion as unverified and continues later criteria', async () => {
    const firstText = { isVisible: vi.fn().mockResolvedValue(false) };
    const secondText = { isVisible: vi.fn().mockResolvedValue(true) };
    const page = {
      on: vi.fn(), goto: vi.fn().mockResolvedValue({ status: () => 200 }),
      getByPlaceholder: vi.fn(), getByRole: vi.fn(),
      getByText: vi.fn((text: string) => text === '不存在' ? firstText : secondText),
    };
    const collect = createPlaywrightBrowserEvidence({ launch: vi.fn().mockResolvedValue({ newPage: vi.fn().mockResolvedValue(page), close: vi.fn() }) });

    await expect(collect('http://127.0.0.1:5173', {
      criteria: [
        { id: 'missing', title: '不存在的文本', sourceRequirement: '看到不存在', steps: [{ kind: 'assert_text_visible', text: '不存在' }] },
        { id: 'present', title: '可见文本', sourceRequirement: '看到存在', steps: [{ kind: 'assert_text_visible', text: '存在' }] },
      ], manualReview: [],
    } as never)).resolves.toMatchObject({ checks: [{ status: 'not_verified' }, { status: 'verified' }] });
  });
});
