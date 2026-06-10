# HOMYNS — Full UI Revision Plan

This is a large request. I'll group it into 5 phases so you can review progress. All changes are **frontend-only**, mock data, no backend.

---

## Phase 1 — Shell & Navigation polish
- **Curved mobile footer**: redesign `MobileBottomNav.tsx` with a true SVG curve cut-out around the floating "+" button (premium app feel).
- **Profile → "More" page**: list-style rows like a mobile app's More tab (Edit Profile, Change Password, Notifications, App Settings, Help, Privacy, Terms, Logout). Footer: "Managed by **Sunshine Infotech**" → links to `https://sunshineinfotech.in`. Version v1.0.0.
- **Dialog sizing**: reduce width, add proper padding/margins (no more full-width popups).
- **Rename Customer → Client** everywhere (UI text + type aliases). `/customers` redirects to `/clients`.

## Phase 2 — Listing pages, filters, dedicated pages
- All Add/Edit moved to **dedicated routes** (e.g. `/clients/new`, `/clients/:id/edit`). Dialogs removed from `CrudShell` (kept only for confirms).
- **List header**: 80% search input + 20% "+" icon button, single line, mobile-friendly.
- **Filters**: inline on desktop; on mobile a "Filters" toggle button reveals them. Start/End date side-by-side on mobile in one row. **Auto-apply** (no Apply/Reset buttons — only a small "Clear" link). Default range = **last 30 days**.
- **Mobile list view**: card divs only, no table, **no pagination**, no CSV download (download stays desktop-only).
- **Fix Dashboard table sort** (asc/desc) on desktop.
- **Fix "Select Client" button** in Step 1 of Create Quotation → opens dedicated client picker / `/clients/new`.

## Phase 3 — Master restructure (per your schema)
- **Client**: name, phone, alt phone, whatsapp (+ buttons "Same as Phone" / "Same as Alt"), email, address, state, city, area, notes.
- **Employee** (new master): name, email, phone, reporting_manager, joining_date, aadhaar, profile_image, is_active. Mock OTP & last_login shown read-only.
- **Package**: name, base_price, duration_days, **CKEditor rich description** (images + long text). Per-package: items table with **per-item remark**, and inside each item the **raw materials with per-material remark** (grouped table so it's clear which raw material belongs to which item).
- **Category** (renamed from Items master) + new **Subcategory** (category_id, name, default_width/height/unit/rate, material_type).
- **Raw Material**: name, color, unit, size, thickness, brand, stock_qty, min_stock, rate.
- **Item Type radio** (Color / Plastic / Sheet / Hardware / Glass / Metal / Wood / Other) added to Subcategory / Item form.
- **Room master**: room name + linked categories (used by quotation flow).

## Phase 4 — Quotation workflow upgrades
- **Customize Items step**: hierarchy Room → Category → Subcategory → Raw Materials. Per-item **requirement remark** textarea. Per raw-material details shown inline.
- **Summary step**: **Special Instructions** textarea, **Discount** (₹ or %), **GST toggle** (With / Without). Live recompute: Subtotal → Discount → GST → Final Total.
- **Status flow**: new quotation saves as **Pending** → goes to new `/quotations/pending` page → Approver can **Approve** or **Reject (with reason)**.
- On **Reject**: modal asks "Re-Generate or Cancel". Re-Generate opens wizard prefilled with selections, user edits and resubmits.
- Quotation list shows **Approved By / Rejected By** + timestamps.
- Dashboard adds **Pending Quotations** widget + KPI.

## Phase 5 — Polish pass
- Spacing/margin/padding audit across all pages.
- Consistent rounded-2xl cards, soft shadows.
- Mobile-first review of every screen.

---

## Technical notes
- CKEditor: add `@ckeditor/ckeditor5-react` + `@ckeditor/ckeditor5-build-classic`, lazy-loaded only on Package edit page.
- New types in `src/data/mockData.ts`: `Employee`, `Category`, `Subcategory`, `Approval`, extended `Client`, extended `Quotation` (status, approver, reject reason, special instructions, discount, gst flag, items[] with remarks).
- New routes: `/clients/new`, `/clients/:id/edit`, `/packages/new`, `/packages/:id/edit`, `/employees`, `/subcategories`, `/quotations/pending`, plus equivalent edit pages for each master.
- `CrudShell` simplified: list + search + add button only; remove dialog form.
- `DataTable`: add `defaultDateRange={days:30}` filter support, hide download on mobile, hide pagination on mobile.

---

## Questions before I start
1. **Phasing**: build all 5 phases now in one big pass, or **stop after each phase** for review? (Recommended: stop after Phase 2 — that's the biggest UX shift.)
2. **CKEditor**: confirm OK to add ~2 npm packages for rich text? Alternative is a lighter editor (`react-quill`, ~1 package).
3. **Approval roles**: should *any* logged-in mock user be able to approve, or only an "Admin" role? (Frontend-only — just controls which buttons show.)
