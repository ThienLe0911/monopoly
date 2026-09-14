import { test, expect } from '@playwright/test';

test('a page reload rejoins the same room instead of losing the seat', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Đang kết nối/)).toBeHidden({ timeout: 10_000 });

  await page.getByPlaceholder(/Nhập tên của bạn/).first().fill('Reload Tester');
  await page.getByRole('button', { name: /BẮT ĐẦU TẠO PHÒNG/ }).click();

  await expect(page.getByText('MÃ PHÒNG:')).toBeVisible({ timeout: 10_000 });
  const roomCode = await page.locator('text=MÃ PHÒNG:').locator('xpath=following-sibling::*[1]').innerText();

  await page.reload();

  // Should skip the create/join form entirely and land back in the same
  // room's lobby - not be stuck re-entering a name or a room code.
  await expect(page.getByText('MÃ PHÒNG:')).toBeVisible({ timeout: 10_000 });
  const roomCodeAfterReload = await page.locator('text=MÃ PHÒNG:').locator('xpath=following-sibling::*[1]').innerText();
  expect(roomCodeAfterReload).toBe(roomCode);
  await expect(page.getByText('Reload Tester')).toBeVisible();
});
