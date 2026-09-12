import { test, expect } from '@playwright/test';

test('landing page loads and creating a room reaches the lobby', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Cờ Tỉ Phú 2026')).toBeVisible();

  // Wait for the WebSocket connection to the game server before the submit button is enabled.
  await expect(page.getByText(/Đang kết nối/)).toBeHidden({ timeout: 10_000 });

  await page.getByPlaceholder(/Nhập tên của bạn/).first().fill('Playwright Tester');
  await page.getByRole('button', { name: /BẮT ĐẦU TẠO PHÒNG/ }).click();

  await expect(page.getByText('MÃ PHÒNG:')).toBeVisible({ timeout: 10_000 });
});
