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


## 8. Development Integrity Blocker (BlockScreen)

### Context
A high-level security component was added to cover the entire application when access needs to be paused (e.g. for maintenance or development settlement). It prevents all user interactions while providing a hidden bypass for developers.

### Modified Code Mentions
- **`src/components/BlockScreen.tsx`**: New component with a secret 5-tap gesture logic on the icon.
- **`src/App.tsx`**: Integrated at the root level using a `blocked` state.

### Secret Gesture
- **Action**: Tap the warning icon **5 times** in **3 seconds**.
- **Result**: Self-unlocks the application session.

---

## 9. Recent Logic of Adding Columns & Sequential Installment Sorting

### Context
To support highly structured and chronological tables within active projects, we revised the entire pipeline of adding columns (installment definitions). It provides a bulletproof sequential schema where newly added columns are seamlessly persisted and correctly position themselves chronologically in database views, rather than introducing complex auto-detected pattern shifts or random order changes.

### Complete Lifecycle/Logic of Adding Columns

#### **A. Sheet Dialog Collection (`src/components/ProjectModals.tsx` - `AddDefSheet`)**
When a manager adds a new column, the `AddDefSheet` modal coordinates user inputs for the name, target amount, and due date. On save, it:
1. Auto-generates a unique alphanumeric ID utilizing `uid("D-")`.
2. Collects the physical target project ID and plan ID.
3. Automatically attaches a high-resolution absolute creation timestamp: `createdAt: new Date().toISOString()`.

#### **B. Schema Injection & Sanitization Filter (`src/App.tsx`)**
- Declared `createdAt` in the central field schema `INST_DEF_FIELDS`:
  ```typescript
  export const INST_DEF_FIELDS = ["id", "projectId", "planId", "title", "dueDate", "targetAmount", "createdAt"];
  ```
- Uses the `sanitize(d, INST_DEF_FIELDS)` utility before write transactions. This acts as a database filter, discarding unauthorized fields and preventing un-structured attributes from polluting Firestore.

#### **C. Firestore Persistence Layer (`src/App.tsx` - `addInstDef`)**
- Writes the clean object to Firestore using standard document keys (`setDoc` targeting database node `"instDefs"`):
  ```typescript
  await setDoc(doc(db, "instDefs", clean.id), clean);
  ```
- Submits audit logs synchronously to log chronological events (`addLog`), making audits fully searchable.

#### **D. Hybrid Sorting Utility (`src/lib/utils.ts`)**
- Integrates a robust hybrid sorting algorithm to arrange installment columns:
  - If both items have a `createdAt` timestamp, they sort strictly chronologically by creation timestamp, ensuring newly added columns sequence beautifully.
  - If one item has a timestamp and the other doesn't, the item without a timestamp comes first (placing pre-existing, legacy columns before any newly added ones).
  - If neither has a `createdAt` timestamp, the sorting falls back to the robust title/regex/digit weights and due dates, fully restoring the legacy items to their perfect, expected serial sequence.
  ```typescript
  export function sortInstallmentDefs(defs: any[]): any[] {
    return [...defs].sort((a: any, b: any) => {
      const cA = a.createdAt || "";
      const cB = b.createdAt || "";

      if (cA && cB) {
        if (cA !== cB) return cA.localeCompare(cB);
      }

      if (!cA && cB) return -1;
      if (cA && !cB) return 1;

      // Fallback: use legacy weight-and-title sorting if neither has createdAt
      // ...
    });
  }
  ```

---

## 10. Easy 4-Digit Voucher Handing & Display

### Context
To replace the default appearance of randomized Firestore document IDs in the Expense list view header (Selector 1), we updated the UI showing voucher numbers. If a custom voucher number is supplied when submitting the Expense Form, it is used immediately. If left empty, a clean, 4-digit easy random number is auto-generated on submission and saved. Any legacy records without a voucher number are instantly resolved at render time with a stable 4-digit fallback derived from their identifier.

### Modified Code Mentions

#### **A. Auto-generation on Submission (`src/components/ExpenseManagement.tsx`)**
- Added check during state payload assembly:
  ```typescript
  const promoVoucher = (formData.voucherCode || "").trim()
    ? (formData.voucherCode || "").trim()
    : Math.floor(1000 + Math.random() * 9000).toString();
  ```
- Persists `voucherCode: promoVoucher` to Firestore.

#### **B. Aesthetic Unified Card Header / Tag Rendering (`src/components/ExpenseManagement.tsx`)**
- Both the upper badge inside the card header (Selector 1) and the bottom details tag (Selector 2) now render either the user's explicit voucher or a stable numeric fallback:
  ```typescript
  const getEasyVoucherFallback = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return (Math.abs(hash) % 9000 + 1000).toString();
  };

  const displayVoucher = expense.voucherCode && expense.voucherCode.trim()
    ? expense.voucherCode
    : getEasyVoucherFallback(expense.id);
  ```

---

## 11. Single-Line Description Truncation & Ellipsis

### Context
To keep the Expense card layout pristine and highly scalable when dealing with abnormally long descriptions, we configured the summary view explanation to truncate gracefully into a single clean line using standard ellipsis termination, preserving layout rhythm. The full description is fully visible inside the interactive modal when selected.

---

## 12. Standard Popup Expense Details & Integrated Edit/Delete Controller

### Context
Rather than expanding complex card components in-line (which leads to layout shift and poor desktop scaling), we implemented a highly polished overlay modal. Deep details (Scope, Voucher Code, Destination, Payment Option, and large Amount visuals) are organized into structured blocks. Inside this popup, the manager has quick action access to delete directly (with inline confirmations) or edit, which smoothly re-populates the standard form modal.

### Modified Code Mentions

#### **A. Clickable Container Integration (`src/components/ExpenseManagement.tsx`)**
- Summary card is simplified and forwards `onClick` listeners with delicate scale transition feedback:
  ```typescript
  <ExpenseCard key={expense.id} expense={expense} lang={lang} onClick={() => setSelectedExpenseForDetails(expense)} />
  ```

#### **B. Elegant details popup (`src/components/ExpenseManagement.tsx` — `ExpenseDetailsModal`)**
- Renders Category-styled header colors matching their respective categories.
- Shows prominent amount figures and a structured grid representation for all parameters (Destination, Date, Mode, etc.) using crisp layout boxes.
- Allows direct updates by setting states for `expenseToEdit` and passing them back to the creator modal.

#### **C. DRY Update Support (`src/components/ExpenseManagement.tsx` — `AddExpenseModal`)**
- Standardized the core creation hook to switch to an "Edit and Update" mode if an `expenseToEdit` object is provided, pre-filling input controllers and submitting via firestore's `updateDoc` safely.

---

## 13. High-Quality Brand Logo Integration Across Views (Login, Sidebar, and printed Dual Receipts)

### Context
To elevate the visual authority and corporate identity of MARQ Builders, we implemented the high-quality circular brand icon (`/logo.png`) systematically across multiple interface boundaries. This ensures absolute consistency while preserving visual density, crisp typography, and optimal element scaling across both digital screens and printed invoices.

### Unified Logo Implementations

#### **A. Global Decoupled URL Utility (`src/lib/data.ts`)**
A static path constant is exposed to prevent route breakage and duplicate code:
```typescript
export const LOGO_URL = "/logo.png";
```

#### **B. Login Landing Page Portal (`src/components/Shared.tsx` - `LoginScreen`)**
- Displays the brand logo inside a centrally aligned visual anchor above the interactive forms.
- Formatted within a robust layout box (`w-36 h-36`) with overflow safety to allow comfortable negative spacing:
  ```jsx
  <div className="w-36 h-36 flex items-center justify-center overflow-visible mx-auto mb-2">
    <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain scale-[1.9]" referrerPolicy="no-referrer" />
  </div>
  ```
- Sized precisely to `scale-[1.9]` to make the graphic readable on mobile and desktop while maintaining crisp pixel boundaries.

#### **C. Responsive Navigation Side-Drawer (`src/components/Shared.tsx` - `Drawer`)**
- Present at the top of the expandable side menu.
- Resized to a space-saving `w-12 h-12 flex items-center justify-center` container to keep navigation elements clean.
- Uses `scale-[1.7]` to scale the logo graphic so it aligns perfectly next to the primary text brand label "MARQ BUILDERS".

#### **D. High-Fidelity Printable Dual Invoices (`src/components/ProjectModals.tsx` - `ReceiptSheet`)**
- Integrated into printable invoices for both Customer Copy and Office Copy sections (separated by a dashed line).
- Ensures professional alignment matching commercial billing receipts.
- Renders at scale within standard print grids, respecting page boundaries when executing native client printing (`@media print`).

---

## Developer Check-List for Clones
1. **Search & Destroy `isGlobal`:** Run a global grep for `isGlobal`. Ensure it's removed from filters, map functions, and state initializers.
2. **Sync i18n:** Ensure the Bengali and English translation files match the updated UI strings.
3. **Verify Dashboard Totals:** After removing globals, check if the "Project Expected" total matches the sum of "Client Expected" amounts.
4. **Font/UI Accuracy:** Check the `BDTshort` outputs in high-density tables (like Project Detail) to ensure layout doesn't break with the extra digit.
5. **Sort Performance:** In very large projects (500+ clients), consider memoizing the sort result to prevent re-calculation on every re-render.
6. **Data Integrity:** Always use `validPayments` for financial aggregations to prevent orphaned records from skewing data.
7. **Print Testing:** Test receipt printing in Chrome and Safari; ensure "Background Graphics" is enabled or enforced via CSS for the banner colors.
8. **Consult Agent Skill:** If you are unsure how to perform a specific workflow (e.g. adding complex installments), refer to `AGENT_OPERATING_SKILL.md` for a literal step-by-step guide.
9. **Creation Timestamp Check:** Ensure any manually added or bulk imported installment definitions support a `createdAt` string/timestamp for proper display order.

---
*Last Updated: 2026-05-22*
