#!/usr/bin/env node

import { createInterface } from "readline";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ENV_FILE = resolve(ROOT, ".env.local");

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

function banner() {
  console.log();
  console.log(`${BOLD}┌─────────────────────────────────────────┐${RESET}`);
  console.log(`${BOLD}│   dbt Platform Asset Explorer — Setup   │${RESET}`);
  console.log(`${BOLD}└─────────────────────────────────────────┘${RESET}`);
  console.log();
}

function step(n, text) {
  console.log(`${CYAN}${BOLD}[${n}]${RESET} ${text}`);
}

async function main() {
  banner();

  // ── Step 1: Check for existing .env.local ──
  let existing = {};
  let skipCredentials = false;

  if (existsSync(ENV_FILE)) {
    console.log(`${YELLOW}Found existing .env.local${RESET}`);
    const content = readFileSync(ENV_FILE, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.+)$/);
      if (match) existing[match[1]] = match[2].trim();
    }

    const hasRequired =
      existing.DBT_SERVICE_TOKEN &&
      existing.DBT_ACCOUNT_ID &&
      existing.DBT_PROJECT_ID &&
      existing.DBT_ENVIRONMENT_ID;

    if (hasRequired) {
      const masked = existing.DBT_SERVICE_TOKEN.slice(0, 8) + "...";
      console.log(`${DIM}  Token:          ${masked}`);
      console.log(`  Account ID:     ${existing.DBT_ACCOUNT_ID}`);
      console.log(`  Project ID:     ${existing.DBT_PROJECT_ID}`);
      console.log(`  Environment ID: ${existing.DBT_ENVIRONMENT_ID}${RESET}\n`);
      const reconfigure = await ask(`  Reconfigure credentials? (y/N): `);
      if (reconfigure.toLowerCase() !== "y") {
        skipCredentials = true;
        console.log(`\n  ${GREEN}✓${RESET} Using existing credentials\n`);
      } else {
        existing = {};
      }
    } else {
      console.log(`${DIM}  Config file exists but is incomplete — prompting for values.${RESET}`);
    }
    console.log();
  }

  // ── Step 2: Collect credentials ──
  if (!skipCredentials) {
    step(1, "dbt Platform Credentials\n");
    console.log(`${DIM}  You'll need these from your dbt Platform account.`);
    console.log(`  See the README for detailed instructions on where to find each value.${RESET}\n`);
  }

  if (!skipCredentials) {
    const fields = [
      {
        key: "DBT_SERVICE_TOKEN",
        label: "Service Token",
        hint: "starts with dbtc_",
        required: true,
      },
      {
        key: "DBT_ACCOUNT_ID",
        label: "Account ID",
        hint: "numeric, from the URL after /deploy/",
        required: true,
      },
      {
        key: "DBT_PROJECT_ID",
        label: "Project ID",
        hint: "numeric, from the URL after /projects/",
        required: true,
      },
      {
        key: "DBT_ENVIRONMENT_ID",
        label: "Environment ID",
        hint: "numeric, production environment recommended",
        required: true,
      },
      {
        key: "DBT_DISCOVERY_API_URL",
        label: "Discovery API URL",
        hint: "press Enter for default",
        default: "https://metadata.cloud.getdbt.com/graphql",
        required: false,
      },
      {
        key: "DBT_SEMANTIC_LAYER_API_URL",
        label: "Semantic Layer API URL",
        hint: "press Enter for default",
        default: "https://semantic-layer.cloud.getdbt.com/api/graphql",
        required: false,
      },
    ];

    const values = {};
    for (const field of fields) {
      const current = existing[field.key];
      const defaultVal = current || field.default;
      const defaultDisplay = defaultVal
        ? field.key === "DBT_SERVICE_TOKEN" && current
          ? `${current.slice(0, 8)}...`
          : defaultVal
        : "";

      const prompt = defaultDisplay
        ? `  ${field.label} ${DIM}(${field.hint})${RESET}\n  ${DIM}[${defaultDisplay}]${RESET}: `
        : `  ${field.label} ${DIM}(${field.hint})${RESET}: `;

      const answer = await ask(prompt);
      const value = answer.trim() || defaultVal || "";

      if (field.required && !value) {
        console.log(`\n${RED}  ✗ ${field.label} is required. Please re-run setup.${RESET}\n`);
        rl.close();
        process.exit(1);
      }

      values[field.key] = value;
      console.log();
    }

    step(2, "Writing .env.local\n");
    const envContent = Object.entries(values)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") + "\n";
    writeFileSync(ENV_FILE, envContent);
    console.log(`  ${GREEN}✓${RESET} Saved credentials to .env.local\n`);
  }

  // ── Step 4: Install dependencies ──
  step(3, "Installing dependencies\n");
  try {
    console.log(`  ${DIM}Running npm install...${RESET}\n`);
    execSync("npm install", { cwd: ROOT, stdio: "inherit" });
    console.log(`\n  ${GREEN}✓${RESET} Dependencies installed\n`);
  } catch {
    console.log(`\n${RED}  ✗ npm install failed. Try running it manually.${RESET}\n`);
    rl.close();
    process.exit(1);
  }

  // ── Step 5: Offer to start the app ──
  step(4, "Ready to go!\n");
  console.log(`  ${GREEN}${BOLD}Setup complete.${RESET}\n`);
  console.log(`  ${DIM}To start the app, run:${RESET}`);
  console.log(`  ${CYAN}npm run dev${RESET}\n`);
  console.log(`  ${DIM}Then open ${CYAN}http://localhost:3000${RESET} ${DIM}in your browser.${RESET}\n`);

  const startNow = await ask(`  Start the app now? (Y/n): `);
  rl.close();

  if (startNow.toLowerCase() !== "n") {
    console.log(`\n  ${DIM}Starting dev server...${RESET}\n`);
    execSync("npm run dev", { cwd: ROOT, stdio: "inherit" });
  } else {
    console.log(`\n  ${DIM}Run ${CYAN}npm run dev${RESET}${DIM} whenever you're ready.${RESET}\n`);
  }
}

main().catch((err) => {
  console.error(`\n${RED}Setup failed:${RESET}`, err.message);
  rl.close();
  process.exit(1);
});
