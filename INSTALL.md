# Installation

Once per computer.

## 1. What you need

- **Node.js 20 or newer**: the installer from [nodejs.org](https://nodejs.org)
  (Mac: or `brew install node`). Check: `node -v`.
- **The website's address** and **a login** that can see the screens you want to document.

## 2. Get the kit

Clone the repository (or unzip the folder you were given), then go into it:

```
git clone <the walkthrough-kit repository URL>
cd walkthrough-kit
```

Every command below runs **inside this folder**.

**One copy per project.** Your walkthroughs and `notes/` belong to your project: keep them in your
own copy (or your project's repository), and do not push them to the kit's repository.

## 3. Install

```
npm install
npx playwright install chromium
```

## 4. Your website

Windows:
```
copy .env.example .env
notepad .env
```
Mac:
```
cp .env.example .env
open -e .env
```

Fill in:
```
BASE_URL=https://your-site.example.com
LOGIN_USER=<login>
LOGIN_PASS=<password>
```

`.env` stays on your computer; it is never committed.

## 5. Set the kit to your website

Open `walkthrough.config.mjs` and set:
- `appName`: your product's name;
- `login()`: how your website logs in (it is set for Odoo; see the comments for any other site);
- optionally the colours.

## 6. Give the AI a browser (Playwright MCP)

The AI writes each walkthrough by looking at the real website. Without a browser it cannot see
the screens and has to guess the buttons, so the numbers come out wrong. Add the browser once:

Claude Code:
```
claude mcp add playwright npx @playwright/mcp@latest
```

Another AI tool: add `@playwright/mcp` as an MCP server in its settings
(command `npx`, argument `@playwright/mcp@latest`).

Check: start the AI in this folder and ask it to "open BASE_URL from .env in the browser".
A browser window should open on the website.

## 7. Check it works

```
npm run screens -- example
```

A browser opens, logs in and walks the example. Then open the result:

- Windows: `start output\example\index.html`
- Mac: `open output/example/index.html`

If the login fails, check `.env` and `login()` in `walkthrough.config.mjs`.

Next: [README.md](README.md), to write the walkthroughs of your own screens.
