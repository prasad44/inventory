import { test, expect } from "@playwright/test";

test.describe("shop happy path", () => {
  test("browse → PDP → cart → checkout → order confirmation", async ({ page }) => {
    // Home page loads
    await page.goto("/");
    await expect(page.getByText("VoltHub").first()).toBeVisible();

    // Navigate to Audio category via category tile
    await page.getByRole("link", { name: /audio/i }).first().click();
    await expect(page).toHaveURL(/\/c\?cat=audio/);

    // Click the first product card
    const firstProduct = page.locator('a[href*="/p?slug="]').first();
    await expect(firstProduct).toBeVisible({ timeout: 10_000 });
    await firstProduct.click();
    await expect(page).toHaveURL(/\/p\?slug=/);

    // Add to cart
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect(page.getByText(/added|coming/i).first()).toBeVisible({ timeout: 5_000 });

    // Go to cart
    await page.goto("/cart");
    await expect(page.getByText(/your cart/i)).toBeVisible();

    // Proceed to checkout
    await page.getByRole("link", { name: /proceed to checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout/);

    // Fill checkout form
    await page.fill('input[autocomplete="name"]', "Test Buyer");
    await page.fill('input[autocomplete="tel"]', "0771234567");
    await page.fill('input[autocomplete="email"]', "test@example.com");
    await page.fill('input[autocomplete="address-line1"]', "123 Test Street");
    await page.selectOption("select", "Colombo");
    // Payment method: COD is default, no-op

    // Place order
    await page.getByRole("button", { name: /place order/i }).click();

    // Order confirmation
    await expect(page).toHaveURL(/\/order\?id=/, { timeout: 15_000 });
    await expect(page.getByText(/thanks for your order/i)).toBeVisible();
  });
});
