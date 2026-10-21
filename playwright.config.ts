import { defineConfig, devices } from "@playwright/test";

/**
 * Configuración de la suite end-to-end de la tienda Café de Altura.
 *
 * `npm test` levanta la tienda con `serve` y corre toda la suite en Chromium,
 * dejando el reporte HTML en `playwright-report/`.
 */
const BASE_URL = "http://localhost:4173";

export default defineConfig({
  testDir: "./pruebas/especificaciones",
  // Las pruebas que encuentran un defecto sembrado se quedan en rojo a propósito,
  // así que no se reintentan: un reintento solo repetiría el mismo fallo.
  retries: 0,
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: BASE_URL,
    // Toda la tienda marca sus elementos con `data-test`, así que los page
    // objects pueden usar `getByTestId` en lugar de selectores CSS a mano.
    testIdAttribute: "data-test",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "npx serve tienda -l 4173 --no-clipboard",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
