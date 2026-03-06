# dbt Metric Explorer

A web application for exploring dbt semantic metrics, visualizing lineage graphs, and querying the dbt Semantic Layer.

## What Does This App Do?

This app connects to your dbt Cloud account and lets you:

- **Metric Explorer** — Browse every metric in your dbt project and see interactive lineage graphs showing exactly how data flows from source tables through models and semantic models, all the way to the dashboards that consume them. Supports both object-level and column-level lineage.
- **Query Lab** — Pick a metric and dimensions from dropdowns, see a live 5-row sample of actual data from the Semantic Layer, view the SQL it generated, and trace the full lineage in real time.
- **How It Works** — An in-app reference page that documents every API call, required credentials, and the architecture behind the scenes.

---

## Step-by-Step Setup Guide

Follow these steps in order. If you run into issues, check the [Troubleshooting](#troubleshooting) section at the bottom.

### Step 1: Install Node.js

This app requires **Node.js** (version 18 or higher). If you don't have it installed:

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** version (the big green button)
3. Run the installer and follow the prompts (just click "Next" through everything)
4. When it's done, verify it worked by opening a terminal and running:

```bash
node -v
```

You should see something like `v20.x.x` or `v22.x.x`. Any version 18 or higher works.

> **How to open a terminal:**
> - **Mac**: Open the "Terminal" app (search for it in Spotlight with Cmd+Space)
> - **Windows**: Open "Command Prompt" or "PowerShell" from the Start menu
> - **VS Code / Cursor**: Use the built-in terminal (Ctrl+` or Cmd+`)

### Step 2: Download the Project

If you received this as a zip file, unzip it and note where the folder is.

If you're cloning from a git repository:

```bash
git clone <repo-url>
```

Then navigate into the project folder:

```bash
cd saddle_creek_app
```

> **Tip:** You can also drag the folder onto your terminal window on Mac to auto-fill the path, then press Enter.

### Step 3: Install Dependencies

From inside the project folder, run:

```bash
npm install
```

This will download all the libraries the app needs. It may take a minute or two. You'll see a progress bar. When it finishes you should see something like `added 350 packages`.

> **If you see warnings**, that's normal. Warnings are fine. Only red **errors** are a problem.

### Step 4: Set Up Your dbt Cloud Credentials

The app needs to connect to your dbt Cloud account. You'll create a configuration file with your credentials.

#### 4a. Create the config file

There's a template file called `.env.local.example` in the project. Copy it:

**Mac / Linux:**
```bash
cp .env.local.example .env.local
```

**Windows (Command Prompt):**
```bash
copy .env.local.example .env.local
```

Or you can simply create a new file called `.env.local` (note the dot at the beginning) in the project root folder and paste in this template:

```
DBT_SERVICE_TOKEN=your-token-here
DBT_ACCOUNT_ID=your-account-id
DBT_PROJECT_ID=your-project-id
DBT_ENVIRONMENT_ID=your-environment-id
DBT_DISCOVERY_API_URL=https://metadata.cloud.getdbt.com/graphql
DBT_SEMANTIC_LAYER_API_URL=https://semantic-layer.cloud.getdbt.com/api/graphql
```

#### 4b. Fill in each value

Open `.env.local` in any text editor and replace the placeholder values. Here's where to find each one:

---

**`DBT_SERVICE_TOKEN`** — Your dbt Cloud service token

1. Log in to [dbt Cloud](https://cloud.getdbt.com)
2. Click the **gear icon** (⚙️) in the top right → **Account Settings**
3. In the left sidebar, click **Service Tokens**
4. Click **+ New Token**
5. Give it a name (e.g., "Metric Explorer")
6. Under permissions, select **"Metadata Only"** (or "Member" if Metadata Only is not available)
7. Click **Save**
8. **Copy the token** — it starts with `dbtc_` and looks like: `dbtc_abc123xyz456...`
9. Paste it as the value: `DBT_SERVICE_TOKEN=dbtc_abc123xyz456...`

> **Important:** You can only see the token once when you create it. If you lose it, you'll need to create a new one.

---

**`DBT_ACCOUNT_ID`** — Your account ID number

1. In dbt Cloud, look at the URL in your browser's address bar
2. It looks like: `https://cloud.getdbt.com/deploy/77338/projects/...`
3. The number after `/deploy/` is your Account ID
4. Example: `DBT_ACCOUNT_ID=77338`

---

**`DBT_PROJECT_ID`** — Your project ID number

1. In dbt Cloud, navigate to your project
2. Look at the URL: `https://cloud.getdbt.com/deploy/77338/projects/131392/...`
3. The number after `/projects/` is your Project ID
4. Example: `DBT_PROJECT_ID=131392`

---

**`DBT_ENVIRONMENT_ID`** — Your production environment ID

1. In dbt Cloud, go to **Deploy** → **Environments**
2. Click on your **Production** environment
3. Look at the URL: `https://cloud.getdbt.com/deploy/77338/projects/131392/environments/105436`
4. The last number is your Environment ID
5. Example: `DBT_ENVIRONMENT_ID=105436`

> **Important:** Use the **Production** environment, not a development or staging environment. The app needs metadata from a deployed project.

---

**`DBT_DISCOVERY_API_URL`** and **`DBT_SEMANTIC_LAYER_API_URL`**

For most dbt Cloud users (multi-tenant), these are:

```
DBT_DISCOVERY_API_URL=https://metadata.cloud.getdbt.com/graphql
DBT_SEMANTIC_LAYER_API_URL=https://semantic-layer.cloud.getdbt.com/api/graphql
```

You only need to change these if your organization uses a single-tenant or self-hosted dbt Cloud instance. If you're not sure, the defaults above are almost certainly correct.

---

#### 4c. Verify your file

Your finished `.env.local` should look something like this (with your real values):

```
DBT_SERVICE_TOKEN=dbtc_abc123xyz456def789...
DBT_ACCOUNT_ID=77338
DBT_PROJECT_ID=131392
DBT_ENVIRONMENT_ID=105436
DBT_DISCOVERY_API_URL=https://metadata.cloud.getdbt.com/graphql
DBT_SEMANTIC_LAYER_API_URL=https://semantic-layer.cloud.getdbt.com/api/graphql
```

> **Security note:** The `.env.local` file is listed in `.gitignore`, which means it will **not** be committed to git. Your token stays on your machine only.

### Step 5: Start the App

From the project folder, run:

```bash
npm run dev
```

You should see output like:

```
▲ Next.js 16.x.x (Turbopack)
- Local:    http://localhost:3000
✓ Ready in ~1s
```

Now open your browser and go to:

**[http://localhost:3000](http://localhost:3000)**

You should see the landing page with three cards: **Metric Explorer**, **Query Lab**, and **How It Works**.

> **To stop the app**, go back to your terminal and press **Ctrl+C**.
>
> **To restart it**, just run `npm run dev` again.

---

## Using the App

### Landing Page (`/`)

The home page with three cards linking to each tool. Click any card to get started.

### Metric Explorer (`/explorer`)

1. The left sidebar lists all metrics from your dbt project
2. Click any metric to see its full lineage graph
3. Use the **Object Lineage / Column Lineage** toggle to switch between views
4. Use the **dbt Names / Table Names** toggle to switch between dbt model names and actual database table names
5. Click on any node in the graph to see its details in the right panel
6. Use the **Details**, **Dimensions**, and **Columns** tabs in the right panel for more info

### Query Lab (`/query-lab`)

1. Select a metric from the dropdown at the top
2. Toggle dimensions on/off — for time dimensions, pick a granularity (DAY, WEEK, MONTH, etc.)
3. A pseudo-SQL preview shows your current query
4. Switch between tabs at the bottom:
   - **Object Lineage** — same lineage graph as the explorer
   - **Column Lineage** — field-level data flow visualization
   - **Sample Output** — click "Run Query" to get 5 rows of real data from the Semantic Layer, plus the generated SQL

### How It Works (`/how-it-works`)

Reference documentation showing every API call, the GraphQL queries used, required environment variables, and the overall architecture.

---

## App Structure

| Route | What it does |
|---|---|
| `/` | Landing page — links to all three tools |
| `/explorer` | Metric Explorer — sidebar with metrics + interactive lineage graphs |
| `/query-lab` | Query Lab — build queries, preview data, view lineage |
| `/how-it-works` | API documentation and architecture reference |

## Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js](https://nextjs.org) 16 | React framework — handles both the UI and server-side API routes |
| [React Flow](https://reactflow.dev) | Renders the interactive, draggable lineage graphs |
| [dagre](https://github.com/dagrejs/dagre) | Automatically lays out graph nodes so they don't overlap |
| [Tailwind CSS](https://tailwindcss.com) 4 | Styling and theming |
| TypeScript | Type safety across the entire codebase |

## dbt Cloud APIs Used

The app connects to two dbt Cloud GraphQL APIs. All calls are made server-side through Next.js API routes — your service token is **never** sent to the browser.

| API | Endpoint | What it provides |
|---|---|---|
| **Discovery API** | `metadata.cloud.getdbt.com/graphql` | Project metadata — metrics, semantic models, models, sources, exposures, catalog columns, raw SQL |
| **Semantic Layer API** | `semantic-layer.cloud.getdbt.com/api/graphql` | Runtime metric definitions, queryable dimensions, granularities, and query execution for sample output |

---

## Troubleshooting

### "command not found: npm" or "command not found: node"

Node.js is not installed or not in your system PATH. Go back to [Step 1](#step-1-install-nodejs) and install it. After installing, close and reopen your terminal before trying again.

### "npm install" shows errors

Make sure you're inside the project folder when you run the command. You can verify by running `ls` (Mac/Linux) or `dir` (Windows) — you should see files like `package.json` and `README.md` in the list.

### The app starts but the metrics list is empty

- Double-check that your `DBT_SERVICE_TOKEN` is correct and hasn't expired
- Verify your `DBT_ENVIRONMENT_ID` points to a **production** environment that has had at least one successful run
- Make sure your service token has **Metadata** permissions

### "Query failed" in the Query Lab

- The **Semantic Layer** must be enabled for your dbt Cloud project (this is a dbt Cloud setting, not something in this app)
- Verify `DBT_SEMANTIC_LAYER_API_URL` is correct

### Port 3000 is already in use

Another process is using port 3000. Either stop that process, or the app will automatically try port 3001.

To force-kill whatever is on port 3000:

**Mac / Linux:**
```bash
lsof -ti :3000 | xargs kill -9
```

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

Then run `npm run dev` again.

### I changed `.env.local` but the app isn't picking up the new values

Stop the app (Ctrl+C) and restart it with `npm run dev`. Environment variable changes require a restart.

### I see a blank page or an error page in the browser

Open your browser's developer tools (F12 or right-click → Inspect → Console tab) and check for error messages. Also check the terminal where you ran `npm run dev` for any server-side errors.
