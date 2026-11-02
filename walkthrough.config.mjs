/**
 * Everything that is specific to YOUR website. Change this file once per project.
 *
 * The values below are set up for an Odoo website. For another website, change login() and,
 * if you like, the name and the colours. Nothing else in the kit needs changing.
 */
export default {
  /** Shown at the top of every document and in the browser tab. */
  appName: 'Odoo',

  /** The numbered badges on the screenshots: any CSS colour or gradient. */
  badge: 'linear-gradient(135deg,#8f6d8a,#714b67)',
  /** Section underlines and number chips in the document. */
  color: '#714b67',

  /** The parts of every document, in order. A walkthrough file calls shot('A', ...), shot('B', ...). */
  parts: { A: 'Settings & Configuration', B: 'Main functionality' },

  /** Screen size of the screenshots. */
  viewport: { width: 1440, height: 900 },

  /** Extra "still loading" markers of this website: the run waits until none is on screen. */
  busySelectors: ['.o_loading_indicator', '.o_blockUI', '.o_loading'],

  /** The button an "unsaved changes" dialog offers to leave without saving. */
  discardButton: /^(Discard|Discard changes|Leave page|Yes, discard)$/i,

  /**
   * How to log in. Receives the page and { user, password } from .env (LOGIN_USER, LOGIN_PASS).
   * Must end on a logged-in page.
   *
   * Odoo: the login page is /web/login, the fields are #login and #password, the button "Log in".
   * Another website: open its login page, find its two fields and its button (right-click → Inspect,
   * or ask the AI), and replace the four lines below.
   */
  async login(page, { user, password }) {
    await page.goto('/web/login');
    await page.locator('#login').fill(user);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(u => !u.pathname.includes('/web/login'), { timeout: 90_000 });
  },
};
