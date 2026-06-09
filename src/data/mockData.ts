// Centralized mock master data for Homyns UI.
export type ID = string;

export interface State { id: ID; name: string; }
export interface City { id: ID; stateId: ID; name: string; }
export interface Area { id: ID; stateId: ID; cityId: ID; name: string; }
export interface RawMaterial { id: ID; name: string; code: string; }
export interface Item { id: ID; name: string; rawMaterialIds: ID[]; }
export interface Pkg { id: ID; name: string; details: string; price: number; offerPrice: number; description: string; itemIds: ID[]; }
export interface RoomMaster { id: ID; name: string; }
export interface Customer { id: ID; name: string; mobile: string; email: string; note?: string; }
export interface CustomerAddress { id: ID; customerId: ID; address: string; stateId: ID; cityId: ID; areaId: ID; }
export interface ClientDetail { id: ID; name: string; phone: string; email: string; address: string; areaId: ID; cityId: ID; stateId: ID; }

export interface QuotationRecord {
  id: string;
  customerId: ID;
  customerName: string;
  packageName: string;
  amount: number;
  status: "Draft" | "Pending" | "Approved" | "Rejected" | "Converted";
  date: string;
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
  { id: "a8", stateId: "s6", cityId: "c9", name: "Civil Lines" },
];

export const rawMaterials: RawMaterial[] = [
  { id: "rm1", name: "Plywood 18mm", code: "PLY-18" },
  { id: "rm2", name: "MDF Board", code: "MDF-01" },
  { id: "rm3", name: "Laminate Sheet", code: "LAM-01" },
  { id: "rm4", name: "Soft Close Hinges", code: "HND-SC" },
  { id: "rm5", name: "Marine Plywood", code: "PLY-MR" },
  { id: "rm6", name: "Veneer Finish", code: "VNR-01" },
  { id: "rm7", name: "Granite Top", code: "STN-GR" },
  { id: "rm8", name: "Italian Marble", code: "STN-IT" },
];

export const items: Item[] = [
  { id: "it1", name: "Modular Wardrobe", rawMaterialIds: ["rm1", "rm3", "rm4"] },
  { id: "it2", name: "TV Cabinet", rawMaterialIds: ["rm2", "rm3"] },
  { id: "it3", name: "Modular Kitchen", rawMaterialIds: ["rm5", "rm3", "rm4", "rm7"] },
  { id: "it4", name: "King Bed with Storage", rawMaterialIds: ["rm1", "rm6"] },
  { id: "it5", name: "Study Table", rawMaterialIds: ["rm2", "rm3"] },
  { id: "it6", name: "Vanity Unit", rawMaterialIds: ["rm5", "rm8"] },
];

export const packages: Pkg[] = [
  { id: "pk1", name: "Basic Home", details: "1BHK essentials", price: 199000, offerPrice: 179000, description: "Essential furniture and fixtures.", itemIds: ["it1", "it2", "it5"] },
  { id: "pk2", name: "Regular Home", details: "2BHK premium", price: 449000, offerPrice: 399000, description: "Premium quality with modern design.", itemIds: ["it1", "it2", "it3", "it4"] },
  { id: "pk3", name: "Luxury Home", details: "3BHK bespoke", price: 899000, offerPrice: 799000, description: "Imported materials & bespoke design.", itemIds: ["it1", "it2", "it3", "it4", "it5", "it6"] },
];

export const roomsMaster: RoomMaster[] = [
  { id: "rm-bd", name: "Bedroom" }, { id: "rm-kt", name: "Kitchen" },
  { id: "rm-hl", name: "Hall" }, { id: "rm-dn", name: "Dining" },
  { id: "rm-bt", name: "Bathroom" }, { id: "rm-st", name: "Study" },
];

export const customers: Customer[] = [
  { id: "cu1", name: "Priya Sharma", mobile: "+91 98765 43210", email: "priya.sharma@email.com", note: "VIP client" },
  { id: "cu2", name: "Rahul Mehta", mobile: "+91 87654 32109", email: "rahul.mehta@email.com" },
  { id: "cu3", name: "Ananya Patel", mobile: "+91 76543 21098", email: "ananya.p@email.com" },
  { id: "cu4", name: "Vikram Singh", mobile: "+91 65432 10987", email: "vikram.singh@email.com" },
  { id: "cu5", name: "Neha Iyer", mobile: "+91 99887 76655", email: "neha.iyer@email.com" },
];

export const customerAddresses: CustomerAddress[] = [
  { id: "ca1", customerId: "cu1", address: "Flat 12B, Sea View Apts", stateId: "s1", cityId: "c1", areaId: "a1" },
  { id: "ca2", customerId: "cu2", address: "302 Palm Residency", stateId: "s1", cityId: "c1", areaId: "a2" },
  { id: "ca3", customerId: "cu3", address: "B-204, Lotus Heights", stateId: "s2", cityId: "c3", areaId: "a4" },
];

export const clientDetails: ClientDetail[] = [
  { id: "cd1", name: "Sharma Residences", phone: "+91 98765 43210", email: "contact@sharma.in", address: "12 Sea View", stateId: "s1", cityId: "c1", areaId: "a1" },
];

export const quotations: QuotationRecord[] = [
  { id: "Q-2026-001", customerId: "cu1", customerName: "Priya Sharma", packageName: "Luxury Home", amount: 850000, status: "Approved", date: "2026-06-02" },
  { id: "Q-2026-002", customerId: "cu2", customerName: "Rahul Mehta", packageName: "Regular Home", amount: 420000, status: "Pending", date: "2026-06-03" },
  { id: "Q-2026-003", customerId: "cu3", customerName: "Ananya Patel", packageName: "Basic Home", amount: 180000, status: "Approved", date: "2026-06-04" },
  { id: "Q-2026-004", customerId: "cu4", customerName: "Vikram Singh", packageName: "Luxury Home", amount: 1200000, status: "Draft", date: "2026-06-05" },
  { id: "Q-2026-005", customerId: "cu5", customerName: "Neha Iyer", packageName: "Regular Home", amount: 510000, status: "Converted", date: "2026-06-05" },
  { id: "Q-2026-006", customerId: "cu1", customerName: "Priya Sharma", packageName: "Basic Home", amount: 195000, status: "Rejected", date: "2026-06-06" },
  { id: "Q-2026-007", customerId: "cu2", customerName: "Rahul Mehta", packageName: "Regular Home", amount: 460000, status: "Draft", date: "2026-06-07" },
  { id: "Q-2026-008", customerId: "cu3", customerName: "Ananya Patel", packageName: "Luxury Home", amount: 980000, status: "Pending", date: "2026-06-08" },
];

export const notifications = [
  { id: "n1", title: "Quotation Approved", body: "Q-2026-001 was approved by Priya Sharma.", time: "2h ago", unread: true },
  { id: "n2", title: "New Customer Added", body: "Neha Iyer added to your customer list.", time: "5h ago", unread: true },
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
