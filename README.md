# Walkthrough Kit

Document any website in **numbered screenshots**. A walkthrough opens the screens of one part of the
site, puts a numbered badge on each main control, and builds one page with a line per number under
every screenshot. Open it in a browser; Ctrl+P (Cmd+P) saves it as a PDF.

It is documentation, not testing: **it never saves anything**. It opens pages, forms, menus and
dialogs, takes the picture, and closes them again (Cancel, Escape, Discard).

Set up once: **[INSTALL.md](INSTALL.md)**.

> **Before anything else: describe your website in `notes/`.**
> The AI starts knowing nothing about your website. Anything you put in `notes/` (a list of the
> screens and their addresses, test cases, a user guide, even screenshots) is read before it
> explores, and the walkthroughs come out faster and right more often. See [notes/README.md](notes/README.md).

---

## What the AI knows, and what it needs

The AI does **not** explore the whole website first. Each prompt explores **only the part it
names**, while writing that part's file:

1. it opens the browser and logs in;
2. it goes through that part's screens, read-only;
3. it writes the file.

Every part is explored on its own; there is no whole-site exploration step.

Expect it to be slower the first time than on a project the AI already knows, and expect one or
two rounds of fixes after the first run (send the AI what the terminal said; see below).

It needs two things:

- **A browser (Playwright MCP).** Without it the AI cannot see the website and guesses the
  buttons. Added once, in [INSTALL.md](INSTALL.md) step 6.
- **Someone who knows the website a little**, to fill in the prompt: where the part starts, where
  its settings are, and its main screens. If you do not know them, write "explore and list its
  screens first" instead: it works, but takes longer.

**Which model:** the first file for a new website is exploring from scratch: use the strongest
model (in Claude Code, Opus, via `/model`). The fixes after a run are everyday work: a lighter
model (Sonnet) is enough.

---

## How it works

```
walkthrough-kit/
  screens.mjs               the engine: login, waiting, numbering, screenshots, the page (do not edit)
  walkthrough.config.mjs    YOUR website: its name, colours and how it logs in (edit once)
  notes/                    what you know about your website, read by the AI first (recommended)
  walkthroughs/
    example.mjs             one walkthrough = one file (copy it, or let the AI write yours)
  output/<name>/            what a run produces: index.html and A1.png, A2.png, B1.png ...
  .env                      the address and the login (yours only, never committed)
```

1. You write (or the AI writes) **one file per part of the site** in `walkthroughs/`, for example
   `walkthroughs/contacts.mjs`, `walkthroughs/invoicing.mjs`, `walkthroughs/settings.mjs`.
2. You run it: `npm run screens -- contacts`.
3. The engine logs in, runs the file, waits for each screen to finish loading, draws the numbers,
   takes the screenshots, and writes `output/contacts/index.html`.

Every document has two parts (change them in `walkthrough.config.mjs`):
**A. Settings & Configuration** (how the feature is set up), then **B. Main functionality** (the
screens in the order people use them).

---

## What to change for a new project

| What | Where | Once per |
|---|---|---|
| The address and the login | `.env` | computer |
| The product's name, the colours, **how to log in** | `walkthrough.config.mjs` | project |
| The screens to document | `walkthroughs/<name>.mjs`, one file per part of the site | part of the site |

Nothing else changes. `screens.mjs` is the same for every project.

**The login** is the only part that differs from site to site. `walkthrough.config.mjs` is set for
Odoo (`/web/login`, fields `#login` and `#password`, button "Log in"). For another site, change
those four lines to its login page, its two fields and its button.

---

## Writing a walkthrough

A walkthrough file exports a title and one function. Each screen is one `shot(...)`:

```js
export const title = 'Contacts';

export default async function contacts(page, { shot, L, visible, close, step }) {
  await step('the list', async () => {
    await page.goto('/odoo/contacts');                       // open the screen
    await visible(page.locator('.o_data_row'), 60_000);       // wait for real data
    await shot('B', 'Contacts › the list', [                  // part, title, the numbered controls
      L(page.getByRole('button', { name: 'New' }), 'Step 1: add a contact'),
      L(page.locator('.o_searchview_input'), 'Search'),
    ]);
  });

  await step('new contact', async () => {
    await page.getByRole('button', { name: 'New' }).click(); // open the form...
    await shot('B', 'Contacts › new contact', [
      L(page.getByLabel('Name'), 'Step 2: the name'),
    ]);
    await close();                                            // ...and leave without saving
  });
}
```

What the function receives:

| Name | What it does |
|---|---|
| `shot(part, title, [L(...)], note?)` | Waits for the screen to load, numbers the controls in the order given, takes the screenshot |
| `L(locator, 'label')` | One numbered control and the line written under the screenshot |
| `visible(locator, ms)` | Waits up to `ms` for something to appear; true or false |
| `close()` | Closes a dialog or menu without saving (Escape, Discard) |
| `step('name', async () => {...})` | One group of screens; if it fails, the run logs it and goes on |
| `pickDay(n)` | Clicks day `n` in an open calendar (to choose a date range with data) |

Rules:
- **Never** click Save, Create, Confirm, Validate, Approve, Delete, Archive or Send.
- **Wait for real data** before a shot (a row, a value), not just the page frame.
- Number only the **main** controls of each screen (3 to 7), each with a short plain label.
- Use an existing record only to look at it.

---

## Let the AI write a walkthrough

Open this folder in Claude Code (or another AI coding tool with the Playwright MCP browser), and send
this prompt, replacing what is in square brackets:

```
Make a walkthrough for [Contacts] in walkthroughs/[contacts].mjs, the same way as
walkthroughs/example.mjs. Read README.md, screens.mjs and walkthrough.config.mjs first,
and everything in notes/ that is about this part of the website.

1. Explore that part of the website in the browser, READ-ONLY: log in with .env, open its
   pages, tabs, forms, dialogs and menus, and close them. Never click Save, Create, Confirm,
   Validate, Approve, Delete, Archive or Send, and never submit a form.
   It starts at [/odoo/contacts]. Its settings are at [Configuration › ...].
   Its main screens are: [the list, a contact, the new-contact form, ...].
2. Write the file:
   - part A: Settings & Configuration, each settings screen and the form it opens;
   - part B: the main screens in the order people use them, with the important forms,
     filters and every step of a multi-step form;
   - 3 to 7 numbered controls per screen, each with a short plain label;
   - wait for real data before each shot; pick a date range that has data.
   - use only locators you confirmed in the browser.
3. Do not change screens.mjs. Do not run anything; give me the command.
```

Then run it, open the result, and send the AI anything to fix, for example:
`In walkthroughs/contacts.mjs, screen B3 was taken before the data loaded, and the terminal says
"not found, not marked: Archive". Fix those two.`

---

## Running

```
npm run screens -- <name>
```

| Then open | Windows | Mac |
|---|---|---|
| The document | `start output\<name>\index.html` | `open output/<name>/index.html` |

As a PDF: in the browser, Ctrl+P (Cmd+P), "Save as PDF". Each part starts on a new page.

Image size: 3× the screen by default (sharp when printed). `SCALE=2` in `.env` halves the files.

### Read the terminal after a run

- `A1  Settings › ...`: one line per screen taken.
- `not found, not marked: <label>`: that control was not on the screen; its number is grey under the
  screenshot. Usually a renamed button: fix the locator in the walkthrough file.
- `!! <step>: <error>`: that group failed and was skipped; the rest of the run went on.

---

## Odoo notes

- Most screens are "actions": `/odoo/action-<number>` (Odoo 17/18) or `/web#action=<number>` (older).
  Copy the address from the browser when you are on the screen.
- Lists: rows are `.o_data_row` (kanban cards `.o_kanban_record`); the "New" button; search
  `.o_searchview_input`; filters `.o_searchview_dropdown_toggler`.
- Forms: `.o_form_view`; Save `.o_form_button_save`; Discard `.o_form_button_cancel`; breadcrumb
  `.o_breadcrumb`; status bar `.o_statusbar_status`.
- An app's settings are usually under **Configuration** in the app's top menu, and in
  **Settings › <the app>**.
- The login user only needs to see the screens. A read-only user is ideal.
