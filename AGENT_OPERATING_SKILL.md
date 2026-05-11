# AGENT_OPERATING_SKILL.md

This document serves as a comprehensive operating manual and "skill" for any AI agent tasked with managing, updating, or operating the MARQ BUILDERS Construction Management System.

## 1. System Overview
The MARQ BUILDERS application is a construction project management and financial tracking tool. It handles multiple projects, each with its own clients, installment plans, and expense tracking.

### Core Entities:
- **Projects**: The top-level entity (e.g., "MARQ HEIGHTS").
- **Plans**: Defined within a project. Clients can be assigned to multiple plans within the same project.
- **Installment Definitions (instDefs)**: Columns in the sheet defining a payment requirement (e.g., "Booking").
- **Clients**: The users/customers. Identified by a unique ID (defaults to Phone).
- **Payments**: Each transaction. Requires approval by a Super Admin if submitted by a standard Admin.
- **Expenses**: Cost logs for a specific project.
- **Logs**: Audit trail of every security-sensitive action.

---

## 2. Navigational Guide (Where to Go)

### A. The Sidebar/Bottom Bar Navigation
- **Home/Dashboard**: High-level financial overview and project selection.
- **Activity Log**: View recent system actions.
- **Admin Manage**: (Super Admin only) Manage system users and their roles.
- **Profile**: Change avatar, name, and password.
- **Language Switcher**: Toggle between English and Bengali (BN).

### B. Inside a Project (Project Detail)
Clicking a project from Home opens its details:
- **Sheet Tab**: The matrix view. Rows = Clients, Columns = Installment Definitions.
- **Clients Tab**: Manage the list of clients in this project.
- **Payments Tab**: List of all approved payment logs.
- **Expenses Tab**: Category-wise expense tracking.
- **Summary Tab**: A specialized list view for tracking total "Due" amounts per client.
- **Log Tab**: Activity log filtered specifically for this project.

---

## 3. How to Perform Key Updates (The "Click-by-Click" Detail)

### 📂 Project Management
- **Add Project**: On the **Home** page, click **"Add Project"**.
- **Edit/Delete**: Long press or click the ⋮ icon on the project card.

### 👥 Client Management
- **Add Client**: Project Detail -> **Clients** tab -> **"Add Client"**.
- **Bulk Import**: Project Detail -> **Clients** tab -> **"Import"**. (See Section 7 for Excel requirements).
- **Edit Info**: Click the **Edit** icon in the client list. 
  - *Warning*: Changing a Client ID will automatically migrate all their associated payments to the new ID.

### 🏗️ Installment Structure (The "Sheet")
- **Add Installment Column**: In the **Sheet** tab, click the **"+"** icon in the header.
- **Add Plan**: Click the **"+"** icon next to the Plan tabs at the top of the sheet.
- **Switch Plans**: Click the Plan tab (e.g., "Revised Plan") to filter the sheet by clients assigned to that plan.

### 💰 Payment Recording & Approval
- **Record**: Click a cell in the Sheet. Enter details.
- **Approve**: (Super Admin) Click the Pending cards on the Home dashboard.
- **Self-Approval**: Payments submitted by a **Super Admin** are approved automatically.

---

## 4. Business Logic & Invariants (Must Follow)

### A. The "Share Count" Calculation
`Installment Target = (Definition Target) * (Client Share Count)`.
- If a client has multiple `planAssignments`, the `shareCount` specific to that plan is used.

### B. Payment Status Flow
1. `pending`: Initial state for Admin-submitted payments.
2. `approved`: Final state. Receipts can only be printed for approved payments.
3. `rejected`: Payment ignored in totals.

### C. Automatic Cleanup
- The system runs a **Garbage Collector** on boot. It deletes any "Orphaned" payments (payments linked to installment definitions that no longer exist).

---

## 5. Metadata & Data Schema (Technical Field List)

When performing raw Firestore operations, use these field names exactly:

| Entity | Fields (`sanitize` keys) |
| :--- | :--- |
| **Client** | `id`, `projectId`, `name`, `fatherHusband`, `birthDate`, `phone`, `email`, `nid`, `plot`, `totalAmount`, `shareCount`, `password`, `photo`, `remarks`, `planAssignments` |
| **Project** | `id`, `name`, `description` |
| **Plan** | `id`, `projectId`, `name` |
| **InstDef** | `id`, `projectId`, `planId`, `title`, `dueDate`, `targetAmount` |
| **Payment** | `id`, `clientId`, `instDefId`, `amount`, `date`, `status`, `note`, `method`, `trxId`, `approvedBy` |
| **Expense** | `id`, `projectId`, `category`, `amount`, `date`, `description` |
| **Admin** | `id`, `name`, `username`, `password`, `role`, `isTemp` |

---

## 6. Pro-Tips for Efficient Operation

- **Long Press Headers**: Long pressing an installment column header in the Sheet opens the edit/delete menu for that column.
- **Long Press Plans**: Long pressing a Plan tab allows renaming or deleting the entire plan structure.
- **Sort by Due**: In the **Summary** tab, use the Sort icon to toggle between "Highest Due" and "Lowest Due" to prioritize collections.
- **Print Receipt**: Every receipt has two copies (Office & Client) on one page. Ensure "Background Graphics" is ON in print settings.

---

## 7. Excel Bulk Import Master Guide

The system uses a fuzzy-matching logic for Excel headers. To ensure successful import, advise the user to use these keywords in their header row:

- **Name**: `name`, `customername`, `fullname`
- **Phone**: `phone`, `mobile`, `contact`
- **ID**: `customerid`, `sl`, `serial`
- **Shares**: `shares`, `sharecount`
  - *Advanced*: Creating columns like "Standard Shares" or "Gold Shares" will automatically map to specific plans.
- **Plot**: `plot`, `flat`, `unit`

---

## 8. Troubleshooting & Safety

- **Missing Permissions**: If you see "Missing or insufficient permissions," check if the user's `uid` is linked to their record in the `roles` collection.
- **Orphaned Payments**: If a project total looks low, check the Logs for "system_cleanup" entries.
- **Default Password**: All new clients are created with `1234` as the default password.
- **Temp Admins**: New admins marked as `isTemp: true` must change their password upon first login.

---

## 9. Rapid & Accurate Payment Entry (Search & Skip Logic)

To ensure speed and precision when processing high volumes of payments, follow this strict search protocol:

### SEARCH STRATEGY
1. **English Primacy**: Always perform searches using the **English** spelling of the client's name.
2. **First Alphabet Shortcut**: Prefer searching with only the **first alphabet** (e.g., type "A" for "Abdullah"). This generates a minimal, manageable list for high-speed fuzzy matching.
3. **Fuzzy Recognition**: Look for spelling variations or common OCR errors in the result list (e.g., "Anas" vs "Anus").

### SAFETY & CLARIFICATION (SKIP LOGIC)
- **Ambiguity Guard**: If the search returns multiple clients with identical names, or if you are in any way confused about which record is correct, **STOP IMMEDIATELY**.
- **Action**: Do not record the payment. Skip that specific entry.
- **Reporting**: Collect all skipped entries and ask for the user's specific clarification at the end of your session. *Accuracy is more valuable than speed.*

---

## 10. Emergency App Blocker (BlockScreen)

The system includes a managed "BlockScreen" for restricting access during maintenance or development settlement.

### HOW TO USE
- To trigger the screen: Set the `blocked` state to `true` in `App.tsx`.
- The screen will show a warning icon (⚠️), a system error message, and a support contact.

### DEVELOPER BYPASS (SECRET GESTURE)
- To bypass the screen without code changes: **Tap/Click the ⚠️ icon 5 times within 3 seconds.**
- The icon will flash "✓" and the app will unlock automatically.

### USE CASES
- **Maintenance**: "System update in progress."
- **Security Check**: "Integrity verification failed."
- **Settlement**: "Service paused until development payment is resolved."

---
*Last Updated: 2026-05-11 (v4)*
