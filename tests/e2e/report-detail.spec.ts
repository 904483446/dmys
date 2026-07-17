import { expect, test } from '@playwright/test';

test('未认证用户不能访问验收报告详情', async ({ page }) => {
  await page.goto('/reports/report-not-owned-by-visitor');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: '登录后开始验收' })).toBeVisible();
});
