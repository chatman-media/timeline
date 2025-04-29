import { expect, test } from "@playwright/test"

test.describe("Timeline", () => {
  test("should load and play media", async ({ page }) => {
    await page.goto("/")

    // Загрузка медиа
    await page.setInputFiles('input[type="file"]', "test.mp4")
    await expect(page.locator(".media-player")).toBeVisible()

    // Воспроизведение
    await page.click('button[aria-label="Play"]')
    await expect(page.locator('button[aria-label="Pause"]')).toBeVisible()

    // Проверка временной шкалы
    await expect(page.locator(".timeline")).toBeVisible()
  })

  test("should handle timeline navigation", async ({ page }) => {
    await page.goto("/")

    // Перемещение по временной шкале
    await page.click(".timeline")
    await page.mouse.down()
    await page.mouse.move(100, 0)
    await page.mouse.up()

    // Проверка позиции
    await expect(page.locator(".current-time")).toHaveText(/00:00:01/)
  })
})
