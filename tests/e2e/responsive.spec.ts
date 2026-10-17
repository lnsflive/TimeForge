import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

const accountClientStub = `
window.SharedAccounts = {
  create() {
    return {
      async initialize() { return { authMethods: ['google', 'password'] } },
      async restore() {
        return { id: 42, username: 'alex', fullName: 'Alex Morgan', email: 'alex@example.com' }
      },
      async headers() { return {} },
      async logout() {}
    }
  },
  async mount() { return { destroy() {} } }
}
`

const timesheets = [
  { id: 1, date: '2026-10-12', startTime: '2026-10-12T08:00:00-05:00', endTime: '2026-10-12T16:30:00-05:00', startLunch: '2026-10-12T12:00:00-05:00', endLunch: '2026-10-12T12:30:00-05:00', startMiles: 120, endMiles: 148, owner: 'alex' },
  { id: 2, date: '2026-10-13', startTime: '2026-10-13T08:15:00-05:00', endTime: '2026-10-13T17:00:00-05:00', startLunch: '2026-10-13T12:15:00-05:00', endLunch: '2026-10-13T12:45:00-05:00', startMiles: 148, endMiles: 166, owner: 'alex' },
  { id: 3, date: '2026-10-14', startTime: '2026-10-14T07:45:00-05:00', endTime: '2026-10-14T16:15:00-05:00', startMiles: 166, endMiles: 190, owner: 'alex' },
  { id: 4, date: '2026-10-15', startTime: '2026-10-15T08:00:00-05:00', endTime: '2026-10-15T16:00:00-05:00', startLunch: '2026-10-15T12:00:00-05:00', endLunch: '2026-10-15T12:30:00-05:00', startMiles: 190, endMiles: 202, owner: 'alex' },
]

async function mockAuthenticatedApp(page: Page) {
  page.on('pageerror', (error) => {
    throw error
  })
  page.on('response', (response) => {
    if (response.status() >= 400) {
      throw new Error(`${response.status()} ${response.url()}`)
    }
  })
  await page.route('https://api.jaimegonzalezjr.com/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/timeforgeprofiles') {
      await route.fulfill({ json: [{ id: 9, payRate: 28.5 }] })
      return
    }
    if (path === '/timesheets') {
      await route.fulfill({ json: timesheets })
      return
    }
    await route.fulfill({ status: 404, json: { message: 'Not found' } })
  })
  await page.route('https://api.jaimegonzalezjr.com/auth/client.v1.js', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: accountClientStub,
  }))
}

async function saveScreenshot(page: Page, filename: string, fullPage = true) {
  if (process.env.UPDATE_REPO_SCREENSHOTS) {
    await page.screenshot({ path: `static/img/${filename}`, fullPage })
  }
}

test('clock workspace fits a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockAuthenticatedApp(page)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /AM|PM/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clock in' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).last()).toBeVisible()
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll')
  await saveScreenshot(page, 'ss1.png', false)
})

test('reports are readable on a tablet', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 })
  await mockAuthenticatedApp(page)
  await page.goto('/dashboard')

  await expect(page.getByRole('heading', { name: 'Timesheet reports' })).toBeVisible()
  await expect(page.getByText('Estimated pay')).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Date' })).toBeVisible()
  await saveScreenshot(page, 'ss2.png')
})

test('profile uses the desktop workspace', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockAuthenticatedApp(page)
  await page.goto('/profile')

  await expect(page.getByRole('heading', { name: 'Profile settings' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).first()).toBeVisible()
  await expect(page.getByLabel('Hourly pay rate')).toHaveValue('28.5')
  await saveScreenshot(page, 'ss3.png')
})
