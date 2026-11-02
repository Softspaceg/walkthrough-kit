# notes/: what you know about your website

The AI reads this folder before it explores a part of the website. It starts knowing nothing,
so whatever you put here saves it guessing, and the numbers on the screenshots come out right
sooner.

Anything helps. One file per part of the website is easiest, for example `notes/contacts.md`:

- the screens of that part and their addresses (copy them from the browser);
- where its settings are;
- the order people use the screens in (for example "create a quote, confirm it, invoice it");
- what the main buttons and fields are called;
- existing test cases, a user guide or a training document;
- screenshots.

A few lines are enough to start:

```
# Contacts
Starts at /odoo/contacts (list, also a kanban view).
Settings: Contacts › Configuration › Tags, Titles, Industries.
Main screens: the list, a contact, the new-contact form (tabs: Contacts & Addresses,
Sales & Purchase, Accounting).
```

Do not put passwords here: they belong in `.env` only.
