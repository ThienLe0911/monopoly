import { test, expect, Browser } from '@playwright/test';

async function newPlayerPage(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { context, page };
}

test('a page reload mid-game rejoins the active game, not just the lobby', async ({ browser }) => {
  const host = await newPlayerPage(browser);
  const guest = await newPlayerPage(browser);

  await host.page.goto('/');
  await expect(host.page.getByText(/Đang kết nối/)).toBeHidden({ timeout: 10_000 });
  await host.page.getByPlaceholder(/Nhập tên của bạn/).first().fill('Host Player');
  await host.page.getByRole('button', { name: /BẮT ĐẦU TẠO PHÒNG/ }).click();
  await expect(host.page.getByText('MÃ PHÒNG:')).toBeVisible({ timeout: 10_000 });
  const roomCode = await host.page.locator('text=MÃ PHÒNG:').locator('xpath=following-sibling::*[1]').innerText();

  await guest.page.goto('/');
  await expect(guest.page.getByText(/Đang kết nối/)).toBeHidden({ timeout: 10_000 });
  await guest.page.getByRole('button', { name: /Nhập Mã 6 Ký Tự/ }).click();
  await guest.page.getByPlaceholder(/Nhập tên của bạn/).first().fill('Guest Player');
  await guest.page.getByPlaceholder(/VD: X7K29P/).fill(roomCode);
  await guest.page.getByRole('button', { name: /VÀO PHÒNG CHỜ/ }).click();
  await expect(guest.page.getByText('MÃ PHÒNG:')).toBeVisible({ timeout: 10_000 });

  // Guest readies up, host starts the game.
  await guest.page.getByRole('button', { name: /SẴN SÀNG/i }).click();
  await host.page.getByRole('button', { name: /BẮT ĐẦU|START/i }).click();

  // Both should now be in the actual game board, not the lobby.
  await expect(host.page.getByText(`PHÒNG: ${roomCode}`)).toBeVisible({ timeout: 10_000 });
  await expect(host.page.getByText('XÍ NGẦU', { exact: true })).toBeVisible({ timeout: 10_000 });

  // Reload the host mid-game - it must resume the game view directly, with
  // the board state intact, instead of dropping back to the landing screen.
  await host.page.reload();
  await expect(host.page.getByText('XÍ NGẦU', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(host.page.getByText(`PHÒNG: ${roomCode}`)).toBeVisible();

  await host.context.close();
  await guest.context.close();
});
