// Centralized mock master data for Homyns UI.
export type ID = string;

export interface State { id: ID; name: string; }
export interface City { id: ID; stateId: ID; name: string; }
export interface Area { id: ID; stateId: ID; cityId: ID; name: string; }

export type ItemType = "Color" | "Plastic" | "Sheet" | "Hardware" | "Glass" | "Metal" | "Wood" | "Other";
export const ITEM_TYPES: ItemType[] = ["Color","Plastic","Sheet","Hardware","Glass","Metal","Wood","Other"];

export interface RawMaterial {
  id: ID; name: string; code: string;
  color?: string; unit?: string; size?: string; thickness?: string;
  brand?: string; stockQty?: number; minStock?: number; rate?: number;
}
export interface Item { id: ID; name: string; rawMaterialIds: ID[]; type?: ItemType; }
export interface Subcategory {
  id: ID; categoryId: ID; name: string;
  defaultWidth?: number; defaultHeight?: number; defaultUnit?: string;
  defaultRate?: number; materialType?: string; type?: ItemType;
}
export interface PackageItemRemark { itemId: ID; remark: string; rawRemarks: Record<ID, string>; }
export interface Pkg {
  id: ID; name: string; details: string; price: number; offerPrice: number;
  description: string; itemIds: ID[]; durationDays?: number;
  itemRemarks?: PackageItemRemark[];
}
export interface RoomMaster { id: ID; name: string; categoryIds?: ID[]; }

export interface Customer {
  id: ID; name: string; mobile: string; email: string; note?: string;
  altPhone?: string; whatsapp?: string;
  address?: string; stateId?: ID; cityId?: ID; areaId?: ID;
}
// Alias
export type Client = Customer;

export interface CustomerAddress { id: ID; customerId: ID; address: string; stateId: ID; cityId: ID; areaId: ID; }
export interface ClientDetail { id: ID; name: string; phone: string; email: string; address: string; areaId: ID; cityId: ID; stateId: ID; }

export interface Employee {
  id: ID; name: string; email: string; phone: string;
  reportingManagerId?: ID; joiningDate?: string; aadhaar?: string;
  profileImage?: string; isActive: boolean;
}

export interface QuotationRecord {
  id: string;
  customerId: ID;
  customerName: string;
  packageName: string;
  amount: number;
  status: "Draft" | "Pending" | "Approved" | "Rejected" | "Converted";
  date: string;
  createdBy?: string;
  approvedBy?: string;
  rejectedBy?: string;
  rejectReason?: string;
  approvedAt?: string;
  specialInstructions?: string;
  discountType?: "rs" | "pct";
  discountValue?: number;
  withGst?: boolean;
}

export const states: State[] = [
  { id: "s1", name: "Maharashtra" }, { id: "s2", name: "Karnataka" },
  { id: "s3", name: "Delhi" }, { id: "s4", name: "Gujarat" },
  { id: "s5", name: "Tamil Nadu" }, { id: "s6", name: "Rajasthan" },
];

export const cities: City[] = [
  { id: "c1", stateId: "s1", name: "Mumbai" }, { id: "c2", stateId: "s1", name: "Pune" },
  { id: "c3", stateId: "s2", name: "Bengaluru" }, { id: "c4", stateId: "s2", name: "Mysore" },
  { id: "c5", stateId: "s3", name: "New Delhi" }, { id: "c6", stateId: "s4", name: "Ahmedabad" },
  { id: "c7", stateId: "s4", name: "Surat" }, { id: "c8", stateId: "s5", name: "Chennai" },
  { id: "c9", stateId: "s6", name: "Jaipur" },
];

export const areas: Area[] = [
  { id: "a1", stateId: "s1", cityId: "c1", name: "Bandra West" },
  { id: "a2", stateId: "s1", cityId: "c1", name: "Juhu" },
  { id: "a3", stateId: "s1", cityId: "c2", name: "Koregaon Park" },
  { id: "a4", stateId: "s2", cityId: "c3", name: "Koramangala" },
  { id: "a5", stateId: "s2", cityId: "c3", name: "Indiranagar" },
  { id: "a6", stateId: "s3", cityId: "c5", name: "Green Park" },
  { id: "a7", stateId: "s4", cityId: "c6", name: "Satellite" },
  { id: "a8", stateId: "s4", cityId: "c6", name: "South Bopal" },
  { id: "a9", stateId: "s6", cityId: "c9", name: "Civil Lines" },
];

export const rawMaterials: RawMaterial[] = [
  { id: "rm1", name: "CenturyPly 18mm", code: "PLY-18", color: "Teak Finish", unit: "Sheet", size: "8x4 Feet", thickness: "18mm", brand: "CenturyPly", stockQty: 50, minStock: 10, rate: 4500 },
  { id: "rm2", name: "MDF Board", code: "MDF-01", unit: "Sheet", size: "8x4 Feet", thickness: "16mm", brand: "Action Tesa", stockQty: 30, minStock: 8, rate: 2200 },
  { id: "rm3", name: "Laminate Sheet", code: "LAM-01", unit: "Sheet", size: "8x4 Feet", thickness: "1mm", brand: "Merino", stockQty: 80, minStock: 20, rate: 1400 },
  { id: "rm4", name: "Soft Close Hinges", code: "HND-SC", unit: "Pair", brand: "Hettich", stockQty: 200, minStock: 50, rate: 320 },
  { id: "rm5", name: "Marine Plywood", code: "PLY-MR", unit: "Sheet", size: "8x4 Feet", thickness: "18mm", brand: "Greenply", stockQty: 25, minStock: 10, rate: 5200 },
  { id: "rm6", name: "Veneer Finish", code: "VNR-01", unit: "Sheet", brand: "Greenlam", stockQty: 40, minStock: 10, rate: 3800 },
  { id: "rm7", name: "Granite Top", code: "STN-GR", unit: "Sqft", brand: "—", stockQty: 120, minStock: 30, rate: 180 },
  { id: "rm8", name: "Italian Marble", code: "STN-IT", unit: "Sqft", brand: "—", stockQty: 60, minStock: 20, rate: 450 },
];

// "Categories" (renamed from Items but kept as `items` for backwards compat)
export const items: Item[] = [
  { id: "it1", name: "Modular Wardrobe", rawMaterialIds: ["rm1", "rm3", "rm4"], type: "Wood" },
  { id: "it2", name: "TV Cabinet", rawMaterialIds: ["rm2", "rm3"], type: "Wood" },
  { id: "it3", name: "Modular Kitchen", rawMaterialIds: ["rm5", "rm3", "rm4", "rm7"], type: "Wood" },
  { id: "it4", name: "King Bed with Storage", rawMaterialIds: ["rm1", "rm6"], type: "Wood" },
  { id: "it5", name: "Study Table", rawMaterialIds: ["rm2", "rm3"], type: "Wood" },
  { id: "it6", name: "Vanity Unit", rawMaterialIds: ["rm5", "rm8"], type: "Wood" },
  { id: "it7", name: "Doors & Door Jamb", rawMaterialIds: ["rm1", "rm6"], type: "Wood" },
];

export const subcategories: Subcategory[] = [
  { id: "sc1", categoryId: "it7", name: "Safety Grill Door", defaultWidth: 3.5, defaultHeight: 7, defaultUnit: "NOS", defaultRate: 2500, materialType: "MS Grill with Wood", type: "Metal" },
  { id: "sc2", categoryId: "it7", name: "Flush Door", defaultWidth: 3, defaultHeight: 7, defaultUnit: "NOS", defaultRate: 3500, materialType: "Plywood", type: "Wood" },
  { id: "sc3", categoryId: "it1", name: "2-Door Wardrobe", defaultWidth: 4, defaultHeight: 7, defaultUnit: "Sqft", defaultRate: 1400, materialType: "Plywood + Laminate", type: "Wood" },
  { id: "sc4", categoryId: "it1", name: "Sliding Wardrobe", defaultWidth: 6, defaultHeight: 7, defaultUnit: "Sqft", defaultRate: 1800, materialType: "Plywood + Veneer", type: "Wood" },
  { id: "sc5", categoryId: "it3", name: "L-Shape Kitchen", defaultWidth: 10, defaultHeight: 8, defaultUnit: "Sqft", defaultRate: 2200, materialType: "Marine Ply + Granite", type: "Wood" },
];

export const packages: Pkg[] = [
  { id: "pk1", name: "1BHK Basic", details: "1BHK essentials", price: 199000, offerPrice: 179000, durationDays: 30, description: "Essential furniture and fixtures.", itemIds: ["it1", "it2", "it5"] },
  { id: "pk2", name: "2BHK Basic", details: "2BHK premium", price: 449000, offerPrice: 399000, durationDays: 45, description: "Basic interior for 2 bedroom flat.", itemIds: ["it1", "it2", "it3", "it4"] },
  { id: "pk3", name: "3BHK Luxury", details: "3BHK bespoke", price: 899000, offerPrice: 799000, durationDays: 60, description: "Imported materials & bespoke design.", itemIds: ["it1", "it2", "it3", "it4", "it5", "it6"] },
];

export const roomsMaster: RoomMaster[] = [
  { id: "rm-bd", name: "Bedroom", categoryIds: ["it1", "it4", "it7"] },
  { id: "rm-kt", name: "Kitchen", categoryIds: ["it3"] },
  { id: "rm-hl", name: "Hall", categoryIds: ["it2", "it7"] },
  { id: "rm-dn", name: "Dining", categoryIds: ["it2"] },
  { id: "rm-bt", name: "Bathroom", categoryIds: ["it6"] },
  { id: "rm-st", name: "Study", categoryIds: ["it5"] },
];

export const customers: Customer[] = [
  { id: "cu1", name: "Mr. Amit Sharma", mobile: "+91 98765 43210", altPhone: "", whatsapp: "+91 98765 43210", email: "amit.sharma@gmail.com", address: "A-12, Sunshine Apartments, Bopal", stateId: "s4", cityId: "c6", areaId: "a8", note: "VIP client" },
  { id: "cu2", name: "Rahul Mehta", mobile: "+91 87654 32109", whatsapp: "+91 87654 32109", email: "rahul.mehta@email.com", address: "302 Palm Residency", stateId: "s1", cityId: "c1", areaId: "a2" },
  { id: "cu3", name: "Ananya Patel", mobile: "+91 76543 21098", whatsapp: "+91 76543 21098", email: "ananya.p@email.com", address: "B-204, Lotus Heights", stateId: "s2", cityId: "c3", areaId: "a4" },
  { id: "cu4", name: "Vikram Singh", mobile: "+91 65432 10987", whatsapp: "+91 65432 10987", email: "vikram.singh@email.com", address: "44 Civil Lines", stateId: "s6", cityId: "c9", areaId: "a9" },
  { id: "cu5", name: "Neha Iyer", mobile: "+91 99887 76655", whatsapp: "+91 99887 76655", email: "neha.iyer@email.com", address: "12 Marine Drive", stateId: "s1", cityId: "c1", areaId: "a1" },
];

export const employees: Employee[] = [
  { id: "e1", name: "Ronak Shah", email: "ronak@homyns.in", phone: "+91 98700 11111", joiningDate: "2023-04-01", aadhaar: "1234 5678 9012", isActive: true },
  { id: "e2", name: "Priya Mehta", email: "priya@homyns.in", phone: "+91 98765 43211", reportingManagerId: "e1", joiningDate: "2024-01-15", aadhaar: "9876 5432 1098", isActive: true },
];

export const customerAddresses: CustomerAddress[] = [
  { id: "ca1", customerId: "cu1", address: "A-12, Sunshine Apartments, Bopal", stateId: "s4", cityId: "c6", areaId: "a8" },
];

export const clientDetails: ClientDetail[] = [
  { id: "cd1", name: "Sharma Residences", phone: "+91 98765 43210", email: "contact@sharma.in", address: "12 Sea View", stateId: "s1", cityId: "c1", areaId: "a1" },
];

const today = new Date();
const ago = (d: number) => { const x = new Date(today); x.setDate(x.getDate() - d); return x.toISOString().slice(0,10); };

export const quotations: QuotationRecord[] = [
  { id: "Q-2026-001", customerId: "cu1", customerName: "Mr. Amit Sharma", packageName: "3BHK Luxury", amount: 850000, status: "Approved", date: ago(2), createdBy: "Priya Mehta", approvedBy: "Ronak Shah", approvedAt: ago(1) },
  { id: "Q-2026-002", customerId: "cu2", customerName: "Rahul Mehta", packageName: "2BHK Basic", amount: 420000, status: "Pending", date: ago(3), createdBy: "Priya Mehta" },
  { id: "Q-2026-003", customerId: "cu3", customerName: "Ananya Patel", packageName: "1BHK Basic", amount: 180000, status: "Approved", date: ago(4), createdBy: "Priya Mehta", approvedBy: "Ronak Shah", approvedAt: ago(3) },
  { id: "Q-2026-004", customerId: "cu4", customerName: "Vikram Singh", packageName: "3BHK Luxury", amount: 1200000, status: "Draft", date: ago(5), createdBy: "Priya Mehta" },
  { id: "Q-2026-005", customerId: "cu5", customerName: "Neha Iyer", packageName: "2BHK Basic", amount: 510000, status: "Converted", date: ago(5), createdBy: "Ronak Shah" },
  { id: "Q-2026-006", customerId: "cu1", customerName: "Mr. Amit Sharma", packageName: "1BHK Basic", amount: 195000, status: "Rejected", date: ago(6), createdBy: "Priya Mehta", rejectedBy: "Ronak Shah", rejectReason: "Budget exceeded" },
  { id: "Q-2026-007", customerId: "cu2", customerName: "Rahul Mehta", packageName: "2BHK Basic", amount: 460000, status: "Draft", date: ago(7), createdBy: "Priya Mehta" },
  { id: "Q-2026-008", customerId: "cu3", customerName: "Ananya Patel", packageName: "3BHK Luxury", amount: 980000, status: "Pending", date: ago(1), createdBy: "Priya Mehta" },
];

export const notifications = [
  { id: "n1", title: "Quotation Approved", body: "Q-2026-001 was approved.", time: "2h ago", unread: true },
  { id: "n2", title: "New Client Added", body: "Neha Iyer added to your client list.", time: "5h ago", unread: true },
  { id: "n3", title: "Draft Pending", body: "Q-2026-007 has been in draft for 1 day.", time: "1d ago", unread: false },
  { id: "n4", title: "Quotation Rejected", body: "Q-2026-006 was rejected.", time: "2d ago", unread: false },
];

export const toOptions = <T extends { id: string; name: string }>(arr: T[]) =>
  arr.map((x) => ({ value: x.id, label: x.name }));

export const fmtINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const statusColor = (s: QuotationRecord["status"]) => {
  switch (s) {
    case "Approved": return "bg-success/10 text-success border-success/20";
    case "Pending": return "bg-warning/10 text-warning border-warning/30";
    case "Draft": return "bg-muted text-muted-foreground border-border";
    case "Rejected": return "bg-destructive/10 text-destructive border-destructive/20";
    case "Converted": return "bg-primary/10 text-primary border-primary/20";
  }
};
