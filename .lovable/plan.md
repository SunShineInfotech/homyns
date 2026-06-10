
This is a large multi-area revision. I'll deliver it in 4 sequential phases so each lands cleanly. Confirm or tell me to reorder/drop a phase before I start.

## Phase 1 — Foundation UI (mobile shell, profile, popups, terminology)

- **Mobile bottom nav redesign** (`MobileBottomNav.tsx`)
  - Floating curved footer, rounded top corners, soft elevated shadow, safe-area aware
  - Items: Home, Quotations, **+ Create (elevated floating)**, Clients, Profile
- **Profile page → "More" page** (`Profile.tsx`)
  - Grouped sections: Account (Edit Profile, Change Password, Notifications, App Settings), Support (Help Center, Contact Support, Privacy Policy, Terms), About (Sunshine Infotech link, v1.0.0), Logout with confirm
- **Popup/dialog restyle** — narrower max-width, padded, rounded-2xl, modern confirm style (tune `ConfirmProvider` + base dialog usage)
- **Terminology**: rename "Customer" → "Client" app-wide (labels, routes alias `/customers` → `/clients`, files keep internal names but visible text changes; nav, headers, page titles, mock data labels)
- **Fix "Select Client" button** in Create Quotation step 1 (Add Client currently no-op → route to dedicated Add Client page)

## Phase 2 — List pages, filters, add/edit pages

- **Search + Add row**: 80/20 layout on all list pages
- **Mobile = cards**, no pagination (infinite list); **Desktop = table** with sort/pagination/CSV
- **Fix dashboard table ASC/DESC sort**
- **Filters**
  - Mobile: collapsible "Show/Hide Filters", Start+End date in one row, default last 30 days, auto-apply (no Search/Reset buttons)
  - Desktop: inline filter bar, auto-apply
- **Dedicated Add/Edit pages** (replace CrudShell modal forms) for: Client, Package, Item, Raw Material, Employee, Room, Category, Subcategory
  - Routes like `/clients/new`, `/clients/:id/edit`, etc.
  - CrudShell stays for list/table; edit flow navigates to page

## Phase 3 — Masters restructure

- **Client** fields: Name, Mobile, Alternate, WhatsApp (+ "Same as Mobile/Alternate" quick buttons), Email, Address, State, City, Area, Notes
- **Employee** master (new): Name, Email, Phone, Reporting Manager, Joining Date, Aadhaar, Profile Image, Active
- **Package**: Name, Description (CKEditor rich text), Base Price, Duration Days
- **Category** (renamed Items): Name
- **Subcategory** (new): Category, Name, Default W/H/Unit/Rate, Material Type
- **Raw Material**: Name, Color, Unit, Size, Thickness, Brand, Stock Qty, Min Stock, Rate
- **Item Type field** with radio: Color/Plastic/Sheet/Hardware/Glass/Metal/Wood/Other (on Subcategory's Material Type)
- **Room Master**: Room Name + linked Categories

CKEditor: use `@ckeditor/ckeditor5-react` + classic build (images, tables, lists, headings, formatting).

## Phase 4 — Quotation workflow & approval

⚠️ Preserve existing 6-step flow; add features on top.
- **Customize Items step**: show Item → Raw Materials → Item Remark textarea per item
- **Summary step additions**: Special Instructions textarea, Discount (% or ₹), GST radio (With/Without), live total recalc
- **Hierarchy enhancement**: Room → Category → Subcategory → Raw Materials → Remarks in summary
- **Status workflow**:
  - New quotation default status `Pending Approval`
  - New page `/quotations/pending` with Approver, Created By, Date
  - Dashboard widget: Pending Quotations
  - Approve / Reject actions; store Approved/Rejected By + Date + Rejection Reason
  - Reject modal asks for reason → buttons Re-Generate / Cancel
  - Re-Generate opens wizard prefilled with prior selections

## Technical notes

- All data stays in `src/data/mockData.ts` (frontend-only, no backend per earlier decision)
- New types added for Employee, Category, Subcategory, Approval metadata
- Routes added to `src/App.tsx`; sidebar/bottom nav updated
- CKEditor adds ~1 dependency; lazy-loaded on Package edit page
- Existing CrudShell modal-edit kept as fallback but list pages will route to dedicated edit pages

## Open questions

1. OK to do all 4 phases now in one large pass, or stop and review after Phase 1?
2. For "Customer → Client" rename: keep route `/customers` as an alias (back-compat) or hard-redirect to `/clients`?
