# Technical Migration & Update Guide: Marq Builder Changes

This document outlines the three most critical recent updates made to the codebase. It is intended for developers who need to replicate these changes in cloned or similar environments while maintaining architectural integrity and logic consistency.

---

## 1. Complete Removal of "Global Payment" (Basic Payment) Feature

### Context
Previously, installments could be marked as `isGlobal`. These applied to all plans in a project and did not multiply by share counts. This feature was removed to simplify the logic and strictly follow plan-based assignments.

### Modified Code Mentions

#### **A. Schema & Data Structure (`src/App.tsx`)**
- Removed `isGlobal` from the `INST_DEF_FIELDS` array.
- This ensures any new data synchronization or export logic ignores this field.

#### **B. UI: Modals & Sheets (`src/components/ProjectModals.tsx`)**
- **Installment Creation:** Removed the `isGlobal` checkbox and the "Same for all" toggle in `AddDefSheet`.
- **Payment Receipts:** Removed conditional rendering of `global_payment_note`.
- **Share Count Logic:** Fixed `shareCount` calculation to strictly use `planAssignments` or default `client.shareCount`.
  ```typescript
  // BEFORE
  const shareCount = instDef.isGlobal ? 1 : (assignment ? assignment.shareCount : (client.shareCount || 1));
  // AFTER
  const shareCount = assignment ? assignment.shareCount : (client.shareCount || 1);
  ```

#### **C. UI: Localization (`src/lib/i18n.tsx`)**
- Removed keys: `common.global_payment_note`, `common.basic_payments`.

---

## 2. Calculation Logic Refinements

### Context
With the removal of Global Payments, the calculation for "Total Expected Amount" and "Total Collected" had to be streamlined. The logic now strictly sums installments within assigned plans, multiplied by their specific share counts.

### Modified Code Mentions

#### **A. Client Summary Logic (`src/App.tsx` & `src/components/ClientPages.tsx`)**
The `totalExpected` logic now avoids any `globalDefs` aggregation. It iterates through a client's plan assignments and sums the target amounts of installments belonging to those specific plans.

```typescript
// Pattern used in calculations:
(client.planAssignments || []).reduce((s, pa) => {
  const pDefs = instDefs.filter((d: any) => d.planId === pa.planId);
  return s + (pDefs.reduce((ds, d) => ds + d.targetAmount, 0) * pa.shareCount);
}, 0);
```

#### **B. Admin/Project Dashboard (`src/components/ProjectDetail.tsx`)**
- Updated `projectTarget` and `projectCollected` calculations.
- Removed the "BASIC" tag badge frominstallment list headers.
- Filtered `prjDefs` strictly by `activePlanId` without injecting project-wide globals.

---

## 3. Fraction Issue: Currency Formatting Precision

### Context
Values like `1,85,000` were being formatted as `1.9L` due to a `.toFixed(1)` rounding rule. To provide more professional and "round figure" accuracy, the precision was increased to 2 decimal places.

### Modified Code Mentions

#### **A. Utility Function (`src/lib/utils.ts`)**
The `BDTshort` function was updated to use `.toFixed(2)` while ensuring trailing zeros are gracefully removed to keep the UI clean (e.g., `1.85L` stays `1.85L`, but `2.00L` becomes `2L`).

```typescript
// src/lib/utils.ts

// BEFORE (Vulnerable to rounding errors)
const val = (v / 100000).toFixed(v % 100000 === 0 ? 0 : 1);

// AFTER (High Precision)
const val = Number((v / 100000).toFixed(2)).toString();
// or 
const val = (v / 100000).toFixed(2).replace(/\.00$/, "");
```

**Implementation Tip:** Using `Number(...).toString()` is the cleanest way to preserve up to 2 decimal places only when they are non-zero.

---

## 4. Dynamic Sorting by Remaining Due in Project Summary

### Context
Admins needed a way to prioritize clients based on their outstanding debt. A sorting mechanism was implemented in the "Kisti Summary" (Project Summary) tab to allow toggling between ascending (Lowest Due First) and descending (Highest Due First) orders.

### Modified Code Mentions

#### **A. State Management & Icons (`src/components/ProjectDetail.tsx`)**
- Added `dueSortOrder` state to track the current direction (`asc` | `desc`).
- Imported `ArrowUpDown` icon from `lucide-react`.

#### **B. Sorting Logic Implementation**
The client list in the `kistisum` tab is now pre-processed before rendering. It calculates the due amount for each client on-the-fly and applies the selected sort order.

```typescript
const sortedClients = [...prjClients].map(c => {
  // ... (Calculation logic for cPaid and cTarget)
  const due = Math.max(0, cTarget - cPaid);
  return { ...c, _calculatedDue: due };
}).sort((a, b) => {
  if (dueSortOrder === "asc") return a._calculatedDue - b._calculatedDue;
  return b._calculatedDue - a._calculatedDue;
});
```

#### **C. UI Enhancement**
- Added a stylized sort toggle button with responsive labels (Bengali/English).
- Implemented a smooth rotation animation for the icon using Tailwind's `rotate-180` and `transition-transform`.

---

## 5. Cascading Delete & Orphaned Data Protection

### Context
Deleting higher-level entities (Plans or Installment Definitions) previously left associated Payment records in the database. This orphaned data caused calculation errors and appeared in historical summaries even after the parent columns were removed.

### Modified Code Mentions

#### **A. Global Filtering Layer (`src/App.tsx`)**
A `validPayments` memoized selector was introduced to ensure only payments linked to existing `instDefs` are processed.

```typescript
const validPayments = useMemo(() => {
  const validDefIds = new Set(instDefs.map(d => d.id));
  return payments.filter((p: any) => validDefIds.has(p.instDefId));
}, [payments, instDefs]);
```
**Impact:** This filtered list is now passed as props to `AdminHome`, `ProjectDetail`, and `ClientPages`, instantly hiding any orphaned legacy data.

#### **B. Cascading Delete Logic (`src/App.tsx`)**
- **Plan Deletion:** Modified `deletePlan` to gather all installment definition IDs within the plan and perform a chunked batch delete (400 records per batch) of all associated payments.
- **Installment Deletion:** Hardened `deleteInstDef` to perform similar chunked batch deletes of related payments before removing the definition itself.

#### **C. UI Consistency**
Updated `ClientInstallments` and `ClientReceipts` in `src/App.tsx` (Prop injection) to use `validPayments`, ensuring the client-side receipt history is always accurate to the current project state.

---

## 6. Enhanced Dual-Receipt Printing Logic

### Context
The application required a reliable way to print dual receipts (Customer Copy and Office Copy) on a single A4/Letter page. Issues included background colors (like the "Money Receipt" banner) disappearing during print, and the print dialog erroneously selecting multiple pages instead of just one.

### Modified Code Mentions

#### **A. Layout Architecture (`src/components/ProjectModals.tsx`)**
- **Dual Copy Rendering:** The `ReceiptModal` was updated to render two `ReceiptContent` components separated by a dashed line.
- **Responsive & Print Dimensions:** Added `min-w-[850px]` for desktop viewing while allowing `min-w-0` and `height: 47%` for printing to ensure they stack perfectly within one page's height.

#### **B. Advanced Print Styling (`@media print`)**
Implemented a "High-Fidelity ISO" print strategy:
- **Global Reset:** Hid all elements by default (`body * { visibility: hidden }`) and selectively showed only the receipt container (`.receipt-print-container`).
- **One-Page Enforcement:** Used `position: fixed` and fixed dimensions (`width: 100%`, `height: 100%`) for the container to lock the browser's print engine into a single-page context.
- **Color Preservation:** Enforced background colors using `-webkit-print-color-adjust: exact` and `box-shadow` hacks for better browser compatibility.
  ```css
  .receipt-paper [class*="bg-[#5c5fc8]"] {
    background-color: #5c5fc8 !important;
    box-shadow: inset 0 0 0 1000px #5c5fc8 !important;
    -webkit-print-color-adjust: exact !important;
  }
  ```
- **Page Break Control:** Used `page-break-inside: avoid` to prevent mid-receipt splits.

#### **C. UI Support (`src/lib/i18n.tsx`)**
- Added missing translations for `common.save`, `common.success_saved`, `common.error_occurred`, and `admin_home.delete_warning` to ensure full localization coverage in modals.

---

## Developer Check-List for Clones
1. **Search & Destroy `isGlobal`:** Run a global grep for `isGlobal`. Ensure it's removed from filters, map functions, and state initializers.
2. **Sync i18n:** Ensure the Bengali and English translation files match the updated UI strings.
3. **Verify Dashboard Totals:** After removing globals, check if the "Project Expected" total matches the sum of "Client Expected" amounts.
4. **Font/UI Accuracy:** Check the `BDTshort` outputs in high-density tables (like Project Detail) to ensure layout doesn't break with the extra digit.
5. **Sort Performance:** In very large projects (500+ clients), consider memoizing the sort result to prevent re-calculation on every re-render.
6. **Data Integrity:** Always use `validPayments` for financial aggregations to prevent orphaned records from skewing data.
7. **Print Testing:** Test receipt printing in Chrome and Safari; ensure "Background Graphics" is enabled or enforced via CSS for the banner colors.

---
*Last Updated: 2026-05-05*
