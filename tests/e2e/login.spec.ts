import { expect, test } from '@playwright/test'

const accountClientStub = `
window.SharedAccounts = {
  create() {
    return {
      async initialize() { return { authMethods: ['google', 'password'] } },
      async restore() { return null },
      async headers() { return {} }
    }
  },
  async mount(container) {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = 'Continue with Google'
    container.appendChild(button)
    return { destroy() {} }
  }
}
`

test('shows the TimeForge login screen', async ({ page }) => {
  await page.route('https://api.jaimegonzalezjr.com/auth/client.v1.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: accountClientStub,
  }))

  await page.goto('/login')

  await expect(page).toHaveTitle('TimeForge - TimeForge')
  await expect(page.getByRole('heading', { name: 'TimeForge' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
})
