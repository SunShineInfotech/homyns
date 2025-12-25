export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  company?: string;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  startingPrice: number;
  features: string[];
  icon: string;
}

export interface RoomItem {
  id: string;
  name: string;
  description?: string;
  size: string;
  unit: string;
  price: number;
  quantity: number;
  included: boolean;
}

export interface Room {
  id: string;
  name: string;
  icon: string;
  items: RoomItem[];
}

export interface QuotationData {
  client: Client | null;
  package: Package | null;
  rooms: Room[];
  subtotal: number;
  tax: number;
  grandTotal: number;
}

export const sampleClients: Client[] = [
  {
    id: "1",
    name: "Priya Sharma",
    email: "priya.sharma@email.com",
    phone: "+91 98765 43210",
    address: "123 Green Park, New Delhi",
    company: "Sharma Residences",
  },
  {
    id: "2",
    name: "Rahul Mehta",
    email: "rahul.mehta@email.com",
    phone: "+91 87654 32109",
    address: "456 Juhu Beach Road, Mumbai",
    company: "Mehta Interiors",
  },
  {
    id: "3",
    name: "Ananya Patel",
    email: "ananya.p@email.com",
    phone: "+91 76543 21098",
    address: "789 Koramangala, Bangalore",
  },
  {
    id: "4",
    name: "Vikram Singh",
    email: "vikram.singh@email.com",
    phone: "+91 65432 10987",
    address: "321 Civil Lines, Jaipur",
    company: "Singh & Associates",
  },
];

export const packages: Package[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Essential furniture and fixtures for a comfortable living space",
    startingPrice: 150000,
    features: ["Standard Materials", "Basic Finishes", "2 Design Revisions", "30-Day Warranty"],
    icon: "home",
  },
  {
    id: "regular",
    name: "Regular",
    description: "Premium quality materials with modern design elements",
    startingPrice: 350000,
    features: ["Premium Materials", "Designer Finishes", "5 Design Revisions", "1-Year Warranty"],
    icon: "building",
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Bespoke designs with imported materials and exclusive finishes",
    startingPrice: 750000,
    features: ["Imported Materials", "Custom Finishes", "Unlimited Revisions", "5-Year Warranty"],
    icon: "crown",
  },
];

export const getRoomsByPackage = (packageId: string): Room[] => {
  const baseRooms: Room[] = [
    {
      id: "living-room",
      name: "Living Room",
      icon: "sofa",
      items: [
        { id: "lr-1", name: "Sofa Set", size: "8x4", unit: "ft", price: 45000, quantity: 1, included: true, description: "3-seater L-shaped sofa" },
        { id: "lr-2", name: "TV Cabinet", size: "6x2", unit: "ft", price: 25000, quantity: 1, included: true, description: "Wall-mounted entertainment unit" },
        { id: "lr-3", name: "Center Table", size: "4x2.5", unit: "ft", price: 15000, quantity: 1, included: true, description: "Wooden center table with storage" },
        { id: "lr-4", name: "Curtains", size: "Standard", unit: "set", price: 8000, quantity: 2, included: true, description: "Blackout curtains with sheers" },
        { id: "lr-5", name: "Accent Chair", size: "Standard", unit: "pc", price: 18000, quantity: 2, included: false, description: "Designer accent chairs" },
      ],
    },
    {
      id: "master-bedroom",
      name: "Master Bedroom",
      icon: "bed",
      items: [
        { id: "mb-1", name: "King Bed", size: "6x6.5", unit: "ft", price: 55000, quantity: 1, included: true, description: "King size bed with headboard" },
        { id: "mb-2", name: "Wardrobe", size: "8x8", unit: "ft", price: 65000, quantity: 1, included: true, description: "Sliding door wardrobe" },
        { id: "mb-3", name: "Side Tables", size: "1.5x1.5", unit: "ft", price: 12000, quantity: 2, included: true, description: "Bedside tables with drawers" },
        { id: "mb-4", name: "Dresser Unit", size: "4x2", unit: "ft", price: 28000, quantity: 1, included: true, description: "Dressing table with mirror" },
        { id: "mb-5", name: "TV Unit", size: "5x1.5", unit: "ft", price: 18000, quantity: 1, included: false, description: "Wall-mounted TV panel" },
      ],
    },
    {
      id: "kitchen",
      name: "Kitchen",
      icon: "chefHat",
      items: [
        { id: "k-1", name: "Modular Kitchen", size: "10x8", unit: "ft", price: 185000, quantity: 1, included: true, description: "Complete modular kitchen setup" },
        { id: "k-2", name: "Chimney", size: "Standard", unit: "pc", price: 25000, quantity: 1, included: true, description: "Auto-clean chimney" },
        { id: "k-3", name: "Tall Unit", size: "2x7", unit: "ft", price: 35000, quantity: 1, included: true, description: "Pantry storage unit" },
        { id: "k-4", name: "Breakfast Counter", size: "4x2", unit: "ft", price: 22000, quantity: 1, included: false, description: "Island breakfast counter" },
      ],
    },
  ];

  if (packageId === "regular" || packageId === "luxury") {
    baseRooms.push({
      id: "guest-room",
      name: "Guest Room",
      icon: "doorOpen",
      items: [
        { id: "gr-1", name: "Queen Bed", size: "5x6", unit: "ft", price: 38000, quantity: 1, included: true, description: "Queen size bed with storage" },
        { id: "gr-2", name: "Wardrobe", size: "6x7", unit: "ft", price: 45000, quantity: 1, included: true, description: "2-door wardrobe" },
        { id: "gr-3", name: "Study Table", size: "4x2", unit: "ft", price: 18000, quantity: 1, included: true, description: "Work desk with drawers" },
      ],
    });
  }

  if (packageId === "luxury") {
    baseRooms.push(
      {
        id: "children-bedroom",
        name: "Children Bedroom",
        icon: "baby",
        items: [
          { id: "cb-1", name: "Bunk Bed", size: "6x3", unit: "ft", price: 42000, quantity: 1, included: true, description: "Colorful bunk bed set" },
          { id: "cb-2", name: "Study Desk", size: "5x2", unit: "ft", price: 22000, quantity: 1, included: true, description: "Child-friendly study desk" },
          { id: "cb-3", name: "Wardrobe", size: "5x7", unit: "ft", price: 38000, quantity: 1, included: true, description: "Kids wardrobe with fun design" },
          { id: "cb-4", name: "Bookshelf", size: "3x5", unit: "ft", price: 15000, quantity: 1, included: true, description: "Open bookshelf unit" },
        ],
      },
      {
        id: "home-office",
        name: "Home Office",
        icon: "briefcase",
        items: [
          { id: "ho-1", name: "Executive Desk", size: "6x3", unit: "ft", price: 45000, quantity: 1, included: true, description: "Premium executive desk" },
          { id: "ho-2", name: "Chair", size: "Standard", unit: "pc", price: 28000, quantity: 1, included: true, description: "Ergonomic office chair" },
          { id: "ho-3", name: "Bookcase", size: "4x6", unit: "ft", price: 32000, quantity: 1, included: true, description: "Built-in bookcase" },
          { id: "ho-4", name: "Filing Cabinet", size: "1.5x3", unit: "ft", price: 18000, quantity: 1, included: false, description: "4-drawer filing cabinet" },
        ],
      }
    );
  }

  // Apply price multipliers based on package
  const priceMultiplier = packageId === "luxury" ? 1.5 : packageId === "regular" ? 1.2 : 1;

  return baseRooms.map((room) => ({
    ...room,
    items: room.items.map((item) => ({
      ...item,
      price: Math.round(item.price * priceMultiplier),
    })),
  }));
};
