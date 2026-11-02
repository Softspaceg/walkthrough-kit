/**
 * EXAMPLE walkthrough of one Odoo screen (an "action": a list of records with its form).
 * Copy this file to walkthroughs/<your-name>.mjs and adapt it, or ask the AI to write yours with the
 * prompt in README.md. The locators below are Odoo's standard ones (Odoo 17/18); confirm them on your
 * site: a control that is not found is only skipped (its number shows grey) and the run carries on.
 *
 * Rules every walkthrough follows:
 *   - one shot(part, 'Page › screen', [L(locator, 'what number N points at'), ...], 'optional note') per screen;
 *   - open, shoot, close(): never Save, Create, Confirm, Validate, Delete, Archive, Send;
 *   - wait for real data (a row, a value) before a shot, not just the page frame;
 *   - wrap each group of screens in step(), so one broken screen does not stop the rest.
 */

export const title = 'Example (Odoo list and form)';

/** The screen to document, as it appears after the site address. Change it. */
const START = '/odoo/action-670';

export default async function example(page, { shot, L, visible, close, step }) {
  const rows = page.locator('.o_data_row, .o_kanban_record');

  // ── A. Settings & Configuration ───────────────────────────────────────────────────
  // Most Odoo apps keep their settings under Configuration in the app's top menu.
  await step('configuration menu', async () => {
    await page.goto(START);
    await visible(rows, 60_000);
    const configMenu = page.getByRole('button', { name: 'Configuration' }).or(page.locator('.o_menu_sections button', { hasText: 'Configuration' }));
    if (!(await visible(configMenu, 3000))) { console.log('     no Configuration menu in this app: part A skipped'); return; }
    await configMenu.first().click();
    await shot('A', 'Configuration menu', [
      L(page.locator('.o-dropdown--menu, .dropdown-menu').first(), 'Where this app is set up: categories, types, rules'),
    ]);
    await close();
  });

  // ── B. Main functionality ─────────────────────────────────────────────────────────
  await step('list', async () => {
    await page.goto(START);
    await visible(rows, 60_000);
    await shot('B', 'The list', [
      L(page.getByRole('button', { name: 'New' }).or(page.locator('.o_list_button_add, .o-kanban-button-new')), 'Step 1: create a new record'),
      L(page.locator('.o_searchview_input'), 'Search'),
      L(page.locator('.o_searchview_dropdown_toggler'), 'Filters, group by and favourites'),
      L(page.locator('.o_switch_view').first(), 'Switch the view: list, kanban, form...'),
      L(rows.first(), 'Open a record'),
    ]);
  });

  await step('filters', async () => {
    await page.locator('.o_searchview_dropdown_toggler').first().click();
    await shot('B', 'The list › filters', [
      L(page.locator('.o_filter_menu, .o_dropdown_container').first(), 'Filters'),
      L(page.locator('.o_group_by_menu').first(), 'Group by'),
    ]);
    await close();
  });

  await step('new record form', async () => {
    await page.getByRole('button', { name: 'New' }).or(page.locator('.o_list_button_add, .o-kanban-button-new')).first().click();
    await visible(page.locator('.o_form_view'), 20_000);
    await shot('B', 'New record', [
      L(page.locator('.o_form_view .o_field_widget input, .o_form_view .o_field_widget textarea').first(), 'Step 2: fill in the fields'),
      L(page.locator('.o_form_button_save'), 'Step 3: save (not clicked here)'),
      L(page.locator('.o_form_button_cancel'), 'Discard'),
      L(page.locator('.o_breadcrumb'), 'Back to the list'),
    ]);
    // Leave without saving.
    const discardForm = page.locator('.o_form_button_cancel');
    if (await visible(discardForm, 2000)) await discardForm.first().click();
    await close();
  });

  await step('a record', async () => {
    await page.goto(START);
    await visible(rows, 60_000);
    await rows.first().click();
    await visible(page.locator('.o_form_view'), 20_000);
    await shot('B', 'A record', [
      L(page.locator('.o_statusbar_status, .o_form_statusbar').first(), 'Its status and the actions it allows'),
      L(page.locator('.o_cp_action_menus, .o_cp_action_menus button').first(), 'More actions'),
      L(page.locator('.o-mail-Chatter, .oe_chatter').first(), 'History and messages'),
    ]);
  });
}
