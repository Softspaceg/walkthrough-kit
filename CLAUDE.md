# Walkthrough Kit: rules for the AI

This folder documents a website in numbered screenshots. You write one walkthrough file per part
of the website; the engine runs it and builds the page. Read [README.md](README.md) before your
first walkthrough.

## Before writing a walkthrough

1. Read `README.md`, `screens.mjs`, `walkthrough.config.mjs` and `walkthroughs/example.mjs`.
2. Read everything in `notes/` about the part you are documenting. It is what the people who know
   the website wrote down; trust it over your guesses.
3. Explore that part of the website in the browser (Playwright MCP), logging in with the address
   and login in `.env`. If no browser tool is available, stop and say so: never write locators
   you have not seen on the real screen.

## Never

- Never click Save, Create, Confirm, Validate, Approve, Reject, Delete, Archive, Send or Post,
  and never submit a form: not while exploring, not in a walkthrough file. Open, look, close
  (Escape, Cancel, Discard).
- Never edit `screens.mjs`. It is the same in every project. If it seems to need a change, explain
  why and ask.
- Never put passwords, tokens or personal data in any file except `.env`.
- Never run a walkthrough yourself unless asked. Give the command: `npm run screens -- <name>`.

## Writing the file

- One file per part of the website: `walkthroughs/<name>.mjs`, shaped like `example.mjs`.
- Part A: Settings & Configuration. Part B: the main screens in the order people use them,
  including the important forms, filters, and every step of a multi-step form.
- 3 to 7 numbered controls per screen, each with a short plain label.
- Wait for real data (a row, a value) before each `shot`, not just the page frame.
- Only locators you confirmed in the browser. Prefer roles and visible names; fall back to stable
  class names.
- Wrap each group of screens in `step(...)` so one broken screen does not stop the rest.

## After a run

The user sends what the terminal printed. `not found, not marked: <label>` means a locator did
not match: look at that screen again and fix the locator. `!! <step>: <error>` means that group
failed: fix the cause, not the symptom. Change only the walkthrough file, then give the command
again.

## The login

`login()` in `walkthrough.config.mjs` is set for Odoo. For another website, look at its login
page and change the address, the two fields and the button; nothing else.
