import { expect, test } from "@playwright/test";

test("로그인하지 않으면 로그인 화면으로 이동한다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("여행 수첩");
  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
});
