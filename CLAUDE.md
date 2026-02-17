# CLAUDE.md

## Project Overview

Financial Modeling System (財務モデリングシステム) — a client-side SPA for startups and SMEs to manage financial statements (P/L, B/S, C/F), perform ratio analysis, and create forecasts. Written in vanilla JavaScript (ES6 modules) with no build system or framework. UI is entirely in Japanese.

## Architecture

```
src/
├── css/
│   ├── variables.css      # Design tokens (colors, spacing, typography, shadows)
│   ├── styles.css          # Base styles and layout
│   └── components.css      # Component-specific styles
└── js/
    ├── app.js              # Entry point — FinancialModelingApp class, init & events
    ├── router.js           # Hash-based SPA routing (#dashboard, #pl, #bs, etc.)
    ├── models/             # Data structure definitions (no logic)
    │   ├── company.js      # Company info
    │   ├── period.js       # Monthly period with P/L, B/S, C/F sub-objects
    │   └── forecast.js     # Forecast settings
    ├── views/              # UI rendering — one class per page
    │   ├── dashboard.js    # KPI overview
    │   ├── pl.js           # Profit & Loss input/display
    │   ├── bs.js           # Balance Sheet input/display
    │   ├── cf.js           # Cash Flow input/display
    │   ├── analysis.js     # Financial ratio analysis
    │   ├── forecast.js     # Forecasting & simulation
    │   ├── settings.js     # Configuration
    │   └── charts.js       # Chart.js rendering utilities
    └── utils/              # Business logic & utilities
        ├── state.js        # Central state management (Observer pattern)
        ├── storage.js      # LocalStorage persistence
        ├── pl-calc.js      # P/L calculation logic
        ├── bs-calc.js      # B/S calculation logic
        ├── cf-calc.js      # C/F calculation logic
        ├── ratios.js       # Financial ratios (ROE, ROA, current ratio, etc.)
        ├── integration.js  # P/L → B/S → C/F auto-sync
        ├── forecast-calc.js # Forecast calculations
        ├── chart-config.js # Chart.js configuration
        ├── csv.js          # CSV export
        ├── json-io.js      # JSON import/export
        └── input-helpers.js # Input validation & formatting
```

**Entry point**: `index.html` loads CSS files and Chart.js from CDN, then bootstraps via `src/js/app.js` (ES6 module).

## Key Patterns

### State Management (`src/js/utils/state.js`)
- Single global state object with `getState()` / `setState()` / `updatePeriod()`
- Observer pattern: components `subscribe()` to state changes
- Auto-saves to `localStorage` under key `app_state`
- Returns deep copies to prevent unintended mutations

### Financial Statement Sync (`src/js/utils/integration.js`)
P/L, B/S, and C/F are automatically kept in sync:
```
P/L net profit → B/S retained earnings → C/F operating cash flow → B/S cash position
```
Editing any statement triggers cascading updates to maintain consistency.

### Routing (`src/js/router.js`)
- Hash-based: `#dashboard`, `#pl`, `#bs`, `#cf`, `#analysis`, `#forecast`, `#settings`
- Default route: `#dashboard`
- Each route maps to a view render function exported from `router.js`

### View Pattern
Each view in `src/js/views/` exports a class with:
```javascript
export class ViewName {
  constructor(container) { this.container = container; }
  render(data, periodIndex) { /* generate HTML, attach listeners, load data */ }
}
```

## Development

### Local Server
No build step. Serve the project root with any HTTP server:
```bash
# Python
python3 -m http.server 8080

# Node (npx)
npx serve .

# VS Code Live Server extension
```
Then open `http://localhost:8080` in a browser.

### Dependencies
- **Chart.js v4.4.1** — loaded via CDN (`cdn.jsdelivr.net`), used for financial charts
- No npm, no `package.json`, no bundler

### Testing
Browser-based custom test framework (no external test library):
- Open `tests/test-runner.html` in a browser
- Click buttons to run test suites

Test files:
```
tests/
├── test-runner.html
├── unit/
│   ├── pl-calc.test.js     # P/L calculation tests
│   ├── bs-calc.test.js     # B/S calculation tests
│   └── ratios.test.js      # Financial ratio tests
└── integration/
    ├── state.test.js        # State management tests
    └── integration.test.js  # P/L→B/S→C/F sync tests
```

There is no CLI test runner — tests run only in the browser.

### Linting & Formatting
None configured. No ESLint, Prettier, or similar tooling exists in this repo.

### CI/CD
`.github/workflows/main.yml` exists but is a placeholder (manual trigger, only echoes "Hello GitHub Actions!"). No automated testing or deployment pipeline.

## Coding Conventions

### JavaScript
- **Variables/functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Classes**: `PascalCase`
- **Modules**: ES6 `import`/`export` — no CommonJS
- **Documentation**: JSDoc comments on all exported functions (comments are in Japanese)
- **No TypeScript** — all code is plain `.js`

### CSS
- Design tokens defined as CSS custom properties in `src/css/variables.css`
- Layout constants: header 64px, sidebar 240px, footer 56px
- Spacing scale: multiples of 4px (4–80px)
- Shadow hierarchy: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`
- Transitions: fast 150ms, base 200ms, slow 300ms

### Data Model
```javascript
{
  company: { name, fiscalYearEnd, currency },
  periods: [{
    year, month,
    pl: { revenue, cogs, sgaExpenses, nonOperating, tax },
    bs: { assets: { current, fixed }, liabilities: { current, fixed }, equity },
    cf: { operating, investing, financing, beginningCash }
  }],
  forecast: { revenueGrowthRate, scenarios },
  currentPeriodIndex: 0,
  initialized: boolean
}
```

### Locale
- UI language: Japanese throughout
- Currency: JPY (Japanese Yen)
- Date granularity: Year + Month (no days)
- Number formatting: `Intl.NumberFormat` with Japanese locale

## Documentation
- `docs/DEVELOPER_GUIDE.md` — comprehensive architecture and API docs
- `docs/USER_MANUAL.md` — end-user guide
- `docs/REQUIREMENTS.md` — functional and non-functional requirements
- `docs/TASKS.md` — phased task breakdown (7 phases, wave-based)

## Common Tasks

### Adding a new financial ratio
1. Add calculation function in `src/js/utils/ratios.js`
2. Add display logic in `src/js/views/analysis.js`
3. Add test in `tests/unit/ratios.test.js`

### Adding a new view/page
1. Create view class in `src/js/views/<name>.js`
2. Register route in `src/js/router.js`
3. Add navigation link in `index.html` sidebar
4. Add render function export in `router.js`

### Modifying calculation logic
- P/L: `src/js/utils/pl-calc.js`
- B/S: `src/js/utils/bs-calc.js`
- C/F: `src/js/utils/cf-calc.js`
- Ensure `src/js/utils/integration.js` sync still works after changes
