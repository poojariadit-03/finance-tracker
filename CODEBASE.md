# Finance Tracker — Codebase Reference

> This file is the source of truth for Claude when making any changes.
> **Always read this before touching any file.**

---

## Project Overview

| Item | Value |
|------|-------|
| Repo | `poojariadit-03/finance-tracker` |
| Live Desktop | `https://poojariadit-03.github.io/finance-tracker/finance-tracker-sync.html` |
| Live Phone | `https://poojariadit-03.github.io/finance-tracker/quick-log-sync.html` |
| Stack | Single HTML files, Firebase Realtime DB, GitHub Pages |
| Currency | Indian Rupees (₹) |
| Firebase DB | `https://my-finance-858b6-default-rtdb.firebaseio.com` |
| Firebase Key | `YOUR_FIREBASE_API_KEY_HERE` |
| GitHub Token | `YOUR_GITHUB_TOKEN_HERE` |

---

## Files

### `finance-tracker-sync.html` (~212KB)
Desktop tracker. All JS + CSS + HTML in one file. No build step.

### `quick-log-sync.html` (~65KB)
Mobile quick-logger. Syncs same Firebase DB. Simpler UI for phone use.

---

## MANDATORY DEPLOY RULE

**Never push without running `/tmp/safe_deploy.py` checks.**
The deploy function blocks if ANY of these fail:

1. JS syntax error (`node --check`)
2. Required HTML IDs missing (see list below)
3. Tab content divs missing
4. `<script>` tag found inside lent tab HTML (structural corruption)
5. onclick functions undefined in JS
6. Duplicate function definitions
7. `alert()` calls

**The #1 cause of crashes:** rebuilding the file with wrong script tag position — HTML patches applied to `src` then JS patches applied separately, then rebuild uses old position → `<script>` bleeds into tab HTML mid-word.

**Always patch HTML and JS in the same Python script session, then call `safe_deploy.deploy()`.**

---

## Data Object — `D`

```js
var D = {
  config: {
    income: 0,          // monthly base income ₹
    savpct: 20,         // savings goal %
    theme: 'auto',      // 'auto' | 'light' | 'dark'
    fontSize: 'normal', // 'normal' | 'large' | 'small'
    dailyLimit: 0,      // daily spending limit ₹
    budgetCarryover: false // carry unused budget to next month
  },
  accounts:        [],  // {id, name, type, openingBalance, note, creditLimit, lowBalanceThreshold}
  expenses:        [],  // {id, date, month, name, cat, amt, accountId, note, tags}
  fixed:           [],  // {id, name, amt, freq, recurring, dueDay, cat, accountId, autoLog, skippedMonths[]}
  paid:            {},  // {YYYY-MM: [fixedId, ...]} — paid status per month
  goals:           [],  // {id, emoji, name, target, deadline, contributions[], autoAmt, autoDay}
  fds:             [],  // {id, bank, amt, rate, tenure, start}
  rds:             [],  // {id, bank, amt, rate, tenure, start}
  budgets:         {},  // {catName: limitAmt}
  autoLogged:      [],  // months already auto-logged ['YYYY-MM', ...]
  extraIncome:     [],  // {id, date, month, name, source, amt, accountId}
  monthResetSeen:  [],  // months where reset modal was shown
  customCategories:[],  // {name, emoji, color}
  liabilities:     [],  // {id, name, amt}
  lent:            [],  // {id, name, amt, date, returnBy, note, returned, returnedDate}
  transfers:       [],  // {id, fromId, toId, amt, date}
  templates:       [],  // {id, name, cat, amt, accId, note}
};
```

---

## Tabs — Desktop (`finance-tracker-sync.html`)

| Tab | `data-tab` | `id` | Render Function |
|-----|-----------|------|-----------------|
| Overview | `overview` | `tab-overview` | `recalc()` + `renderMonthlySummary()` + `renderWeeklySummary()` |
| Accounts | `accounts` | `tab-accounts` | `renderAccounts()` |
| Calendar | `calendar` | `tab-calendar` | `renderCalendar()` |
| Expenses | `expenses` | `tab-expenses` | `renderExpenses()` |
| Fixed | `fixed` | `tab-fixed` | `renderFixed()` |
| History | `history` | `tab-history` | `renderHistory()` + `renderSavingsComparison()` |
| Charts | `charts` | `tab-charts` | `updateCharts()` |
| Goals | `goals` | `tab-goals` | `renderGoals()` |
| Invest | `invest` | `tab-invest` | `renderInvestments()` |
| Net Worth | `networth` | `tab-networth` | `renderNetWorth()` |
| Lent | `lent` | `tab-lent` | `renderLent()` |

---

## Required HTML IDs (checked before every push)

### Lent Tab — ALL must be present
```
tab-lent, lentName, lentAmt, lentDate, lentReturnBy, lentNote,
lent-total, lent-pending, lent-returned,
lentPendingList, lentReturnedList, lentOverdueNote
```

### Toast & UI
```
ftToast       — toast notification div (near </body>)
```

### Net Worth Tab
```
tab-networth, nw-assets, nw-liab, nw-total,
nw-assets-list, nw-liab-list, liabName, liabAmt, nwRatioCard
```

### Overview Tab
```
s-income, s-extra, s-extra-box, s-fixed, s-daily, s-savings, s-balance,
s-today-spent, s-today-box, fixedEstLabel,
income, savSlider, pctOut, savProg, savBar,
budgetHealth, monthlySummary, weeklySummary, weeklyCard,
streakBadge, streakText, extraIncTotal, extraIncList,
healthScoreBody, dailyLimitDisplay
```

### Accounts Tab
```
accountGrid, accTotalBal, lowBalanceBanner, lowBalanceText,
accName, accBal, accNoteInput, accLimitInput, accThreshInput,
transferFrom, transferTo, transferAmt, transferDate, transferList,
editAccModal, eaName, eaType, eaBal, eaNote, eaLimit, eaThresh,
accStmtModal, accStmtTitle, accStmtList
```

### Expenses Tab
```
expList, expName, expCat, expAcc, expAmt, expDate, expNote, expTags,
expRecurring, expSearch, expAnalytics, bulkBar, bulkCount,
dateRangeWrap, rangeFrom, rangeTo, rangeResult,
budgetBars, budgetBadge, budgetCat, budgetAmt, budgetHint, budgetCarryover,
templateList, customCatList
```

### Fixed Tab
```
fixedList, fixedSummary, fixedSummaryCard, recurStatus, pendingBadge,
fixName, fixAmt, fixFreq, fixDueDay, fixCat, fixAccId, fixRecur, fixSearch,
editFixedModal, efName, efAmt, efFreq, efDueDay, efRecur, efAutoLog, efCat, efAccId,
payHistModal, payHistTitle, payHistList
```

### History Tab
```
histFilter, histChart, histLeg, histBody,
savingsComparisonBody, savingsMonthRange
```

### Charts Tab
```
catChart, catLeg, allocChart, allocLeg, accChart, trendChart, top10List
```

### Goals Tab
```
goalCards, gEmoji, gName, gTarget, gDeadline,
autoContribModal, autoContribGoalName, autoContribAmt, autoContribDay
```

### Invest Tab
```
inv-invested, inv-returns, inv-maturity,
fdList, rdList, maturityBanner, matBannerText,
fd-bank, fd-amt, fd-rate, fd-tenure, fd-start,
rd-bank, rd-amt, rd-rate, rd-tenure, rd-start
```

---

## Key JS Functions

### Firebase / Data
| Function | Purpose |
|----------|---------|
| `connectFirebase()` | Parse config, init Firebase |
| `loadFromFirebase()` | Load D from Firebase on startup |
| `autoSave()` | Debounced save (2s), calls `cleanupPaidData()` |
| `saveToFirebase()` | Write `JSON.stringify(D)` to `finances/data` |
| `listenForChanges()` | Real-time listener, skips if `_isSaving` |
| `initDefaults()` | Set default accounts if none exist |

### Overview
| Function | Purpose |
|----------|---------|
| `recalc()` | Recompute all metrics, update DOM |
| `renderMonthlySummary()` | Monthly breakdown card |
| `renderWeeklySummary()` | Weekly card (hides on past months) |
| `renderHealthScore()` | 6-factor health score ring |
| `renderDailyLimit()` | Daily limit progress bar |
| `renderExtraIncome()` | Extra income card + YTD |
| `checkSavingsStreak()` | Streak badge |

### Accounts
| Function | Purpose |
|----------|---------|
| `renderAccounts()` | Account cards + total balance + low balance check |
| `addAccount()` | Add new account (note, creditLimit, threshold) |
| `removeAccount(id)` | Delete with confirm + orphan warning |
| `openEditAccount(id)` | Open edit modal |
| `saveEditAccount()` | Save account edits |
| `openAccountStatement(id)` | Mini bank statement modal |
| `populateAccSel()` | Fill `#expAcc` and `#fixAccId` dropdowns |
| `populateTransferSelects()` | Fill transfer From/To dropdowns |
| `addTransfer()` | Log money transfer between accounts |
| `renderTransferList()` | Show transfer history (expandable) |

### Expenses
| Function | Purpose |
|----------|---------|
| `addExpense()` | Add expense (note, tags, optional add-to-fixed) |
| `removeExpense(id)` | Delete with confirm |
| `renderExpenses(textFilter, dateFilter)` | Render list (delegates to range filter if active) |
| `renderExpensesRange()` | Cross-month date range filter view |
| `applyDateRange()` | Apply From/To date filter |
| `clearDateRange()` | Reset date range |
| `setQFilter(mode, btn)` | Quick filter: all / today / week / reimb |
| `setExpSort(mode, btn)` | Sort: date-desc / date-asc / amt-desc / amt-asc / cat |
| `bulkDelete()` | Delete selected expenses |
| `searchExpenses(q)` | Text search |
| `exportCSV()` | Export current view to CSV |
| `openEdit(id)` | Edit expense modal |
| `saveEdit()` | Save expense edits |
| `renderExpenseAnalytics(arr)` | Analytics row (total, avg, highest, top cat) |
| `populateCatSelects()` | Fill `expCat`, `budgetCat`, `editCat`, `fixCat` |

### Fixed
| Function | Purpose |
|----------|---------|
| `addFixed()` | Add fixed expense (date picker → extracts day) |
| `removeFixed(id)` | Delete with confirm |
| `renderFixed()` | Render list with sort + search |
| `renderFixedSummary()` | Monthly/yearly summary card |
| `togglePaid(id)` | Mark paid/unpaid for current month |
| `openEditFixed(id)` | Edit modal (date picker, autoLog, cat, account) |
| `saveEditFixed()` | Save edits |
| `skipThisMonth(id)` | Skip a fixed item for current month |
| `openPayHistory(id)` | 12-month payment history modal |
| `checkDueDayAutoPay()` | Auto-mark paid + log expense on due date |
| `setFixedSort(mode, btn)` | Sort fixed list |
| `searchFixed(q)` | Search fixed list |
| `cleanupPaidData()` | Remove D.paid entries older than 3 months |
| `checkReminders()` | Show banner for pending + overdue lent |

### History
| Function | Purpose |
|----------|---------|
| `renderHistory()` | 6-month bar chart + table with trend arrows + avg row |
| `renderSavingsComparison()` | Savings bar chart (3/6/12 months) |
| `renderHistoryDays(days)` | Daily view (15d/30d) |
| `setHistRange(val, btn)` | Switch history range |
| `syncSavPill(val)` | Sync savings dropdown with pills |

### Charts
| Function | Purpose |
|----------|---------|
| `updateCharts()` | Render all 4 charts for selected month |
| `setChartMonth(offset, btn)` | Switch chart month (0=current, -1=last, etc) |

### Goals
| Function | Purpose |
|----------|---------|
| `addGoal()` | Add savings goal |
| `removeGoal(id)` | Delete goal |
| `addContrib(id)` | Add contribution |
| `addWithdrawal(id)` | Withdraw from goal (shows red in history) |
| `removeContrib(goalId, idx)` | Delete a contribution |
| `renderGoals()` | Render all goal cards with milestones |
| `openAutoContrib(id)` | Auto-contribution settings |
| `saveAutoContrib()` | Save auto-contribution |
| `checkAutoContribs()` | Run auto-contributions on load |

### Invest
| Function | Purpose |
|----------|---------|
| `renderInvestments()` | FDs + RDs + returns % + maturity banner |
| `addFD()` / `removeFD(id)` | FD CRUD |
| `addRD()` / `removeRD(id)` | RD CRUD |
| `calcFD(p, r, m)` | FD maturity value (quarterly compounding) |
| `calcRD(mo, r, m)` | RD maturity value |
| `mElapsed(start)` | Months elapsed since start date |

### Net Worth
| Function | Purpose |
|----------|---------|
| `renderNetWorth()` | Assets + liabilities + debt ratio card |
| `addLiability()` | Add liability |
| `removeLiability(id)` | Delete liability |

### Lent
| Function | Purpose |
|----------|---------|
| `addLent()` | Add new lent entry |
| `renderLent()` | Render pending + returned lists |
| `markReturned(id)` | Mark fully returned |
| `partialReturn(id)` | Partial return (prompt for amount, reduces balance) |
| `deleteLent(id)` | Delete lent entry |
| `updateLentBadge()` | Update lent tab badge (overdue = red, pending = amber) |

### Utility
| Function | Purpose |
|----------|---------|
| `fmt(n)` | Format ₹ amount (L/Cr for large) |
| `fmtF(n)` | Format ₹ (full digits, no abbreviation) |
| `todayStr()` | YYYY-MM-DD for today |
| `mk(date?)` | YYYY-MM for given date (default: curDate) |
| `getExpenses(date?)` | Expenses for given month |
| `extraIncomeTotal(date?)` | Extra income total for given month |
| `fixedMonthly()` | Estimated monthly fixed cost |
| `getCatColor(name)` | Color for built-in or custom category |
| `getAllCategories()` | BUILTIN_CATS + D.customCategories |
| `showToast(msg, type)` | Show toast notification |
| `switchTab(name)` | Switch active tab |
| `changeMonth(dir)` | Navigate months (resets filters) |

---

## CSS Variables

```css
--bg        background
--sur       card/surface
--sur2      secondary surface (inputs, chips)
--bdr       border
--tx        primary text
--tx2       secondary text
--tx3       muted text
--green     #1D9E75  (dark: #5DCAA5)
--gbg       green background tint
--red       #D85A30  (dark: #F0997B)
--rbg       red background tint
--blue      #185FA5  (dark: #85B7EB)
--bbg       blue background tint
--amber     #BA7517  (dark: #FAC775)
--abg       amber background tint
--purple    #534AB7  (dark: #AFA9EC)
```

Theme classes on `<body>`: `force-light`, `force-dark`, `fs-large`, `fs-small`

---

## State Variables

```js
var db = null;              // Firebase database reference
var saveTimer = null;       // Debounce timer for autoSave
var curDate = new Date();   // Currently viewed month
var selDay = null;          // Selected day in calendar
var _isSaving = false;      // Prevents listener overwrite during save
var _cat, _alloc, _trend, _hist, _acc = null; // Chart instances

// Expense filters
var _qFilterMode = 'all';   // 'all' | 'today' | 'week' | 'reimb'
var _expSort = 'date-desc'; // sort mode
var _rangeFrom = null;      // date range filter start
var _rangeTo = null;        // date range filter end
var _bulkSelected = new Set(); // bulk delete selection

// Fixed tab
var _fixedSort = 'default';
var _fixedSearch = '';
var _editFixedId = null;

// History tab
var _histRangeDays = 0;
var _histRangeMonths = 6;

// Charts tab
var _chartMonthOffset = 0;  // 0=current, -1=last month, etc.
```

---

## Quick Log (`quick-log-sync.html`) — Key Points

- Shares same Firebase DB as desktop (`finances/data`)
- **Must never wipe D fields** — always migrate missing fields on load
- Has 3 modes: Expense / Income / Lent
- D object must include ALL desktop fields to avoid data loss on save
- Key functions: `addExpense()`, `addIncome()`, `addLentQL()`, `renderList()`, `renderQLScore()`, `initUI()`
- Custom categories from desktop appear in phone grid via `getQLCats()`
- Health score: `calcHealthScoreQL()`, `renderQLScore()`

---

## Categories

### Built-in (BUILTIN_CATS)
Food · Transport · Shopping · Health · Entertainment · Utilities · Education · Other

### Custom
Stored in `D.customCategories[]` as `{name, emoji, color}`
Added via `addCustomCategory()`, rendered via `renderCustomCategories()`
Populated into all selects via `populateCatSelects()` which fills:
`expCat`, `budgetCat`, `editCat`, `fixCat`

---

## Auto-Pay (Fixed Tab)

When `checkDueDayAutoPay()` runs (every `renderAll()` call):
1. For each monthly recurring fixed item with a `dueDay`
2. If today's date === `dueDay` AND not already paid AND not skipped AND `autoLog !== false`
3. → Marks paid in `D.paid[month]`
4. → Logs expense for today
5. → Saves + re-renders

Due day is stored as an integer (1-31). The form uses a date picker — only the day number is extracted.

---

## Firebase Structure

```
finances/
  data: "<JSON string of entire D object>"
```

Single key. Entire D object serialized as JSON string. Real-time listener updates UI when data changes from another device.

---

## Common Pitfalls / Things That Break

1. **Lent tab truncation** — The most common crash. `<script>` tag bleeds into lent tab HTML when rebuild uses wrong position. Fixed by `safe_deploy.py` check #4.

2. **JS patched, HTML not updated** — Patching JS in one script session, HTML in another, then rebuilding with wrong base. Always patch both in same session.

3. **`totCur` undeclared** — `renderInvestments()` uses `totCur`. Must be declared as `var totInv=0,totCur=0,totMat=0;` at the top.

4. **`renderSavingsComparison()` inside map callback** — Was accidentally placed inside `histBody.innerHTML = data.map(...).join('')` causing it to only run for the last iteration.

5. **D fields missing on save** — Quick Log saves entire D. If QL's D declaration is missing fields (e.g. `transfers`, `templates`), those fields get wiped from Firebase for all devices.

6. **Firebase listener overwriting mid-save** — Fixed with `_isSaving` flag. Listener skips update if `_isSaving === true`.

7. **expDateFilter** — Old element that no longer exists in HTML. All JS references removed. `filterExpenses()` now just reads `expSearch`.

8. **populateCatSelects()** — Must include `fixCat` in the array, or Fixed tab category dropdown stays empty.

9. **Goal savings with withdrawals** — Contributions can be negative (withdrawals). Must use `Math.max(0, sum)` for display. Raw sum used for accurate progress %.

10. **NetWorth balance ignores transfers** — `renderNetWorth()` must use `tIn`/`tOut` from `D.transfers` same way `renderAccounts()` does.

---

## Deployment Workflow

```python
import sys
sys.path.insert(0, '/tmp')
from safe_deploy import deploy, rebuild

# 1. Download fresh
token = "YOUR_GITHUB_TOKEN_HERE"
# ... download src, get js, sha, ms_end

# 2. Patch HTML (src) and JS (js) in SAME script

# 3. Deploy (checks + push)
deploy(src, js, sha, token, "commit message")
```

Never split HTML patches and JS patches across multiple Python script invocations.
