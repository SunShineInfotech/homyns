// src/data/quotationData.ts
export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  company?: string;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  icon: string;
  startingPrice: number;
  features: string[];
  rooms?: string; // Comma-separated room_ids
}

export interface Room {
  id: string;
  name: string;
  icon: string;
  items: Item[];
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  size?: string;
  unit?: string;
  price: number;
  quantity: number;
  included: boolean;
}

// Sample data
export const sampleClients: Client[] = [
  { id: "1", name: "Aarav Sharma", phone: "+91 98765 43210", email: "aarav@example.com", address: "Mumbai, Maharashtra" },
  { id: "2", name: "Priya Patel", phone: "+91 87654 32109", email: "priya@example.com", address: "Ahmedabad, Gujarat" },
  { id: "3", name: "Rahul Singh", phone: "+91 76543 21098", email: "rahul@example.com", address: "Delhi" },
];

export const packages: Package[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Essential home interior solutions",
    icon: "home",
    startingPrice: 500000,
    features: ["Living Room", "Bedroom", "Kitchen"],
    rooms: "room1,room2,room3"
  },
  {
    id: "regular",
    name: "Regular",
    description: "Premium interiors with modern designs",
    icon: "building",
    startingPrice: 1000000,
    features: ["Living Room", "Bedroom", "Kitchen", "Dining Room"],
    rooms: "room1,room2,room3,room4"
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Ultimate luxury interior experience",
    icon: "crown",
    startingPrice: 2000000,
    features: ["Living Room", "Bedroom", "Kitchen", "Dining Room", "Study Room", "Kids Room"],
    rooms: "room1,room2,room3,room4,room5,room6"
  },
];

export const getRoomsByPackage = (packageId: string): Room[] => {
  // Mock rooms based on package
  const allRooms: Room[] = [
    {
      id: "room1",
      name: "Living Room",
      icon: "sofa",
      items: [
        { id: "item1", name: "Sofa Set", description: "3+1+1 seater", size: "Standard", unit: "Set", price: 45000, quantity: 1, included: true },
        { id: "item2", name: "Coffee Table", description: "Glass top", size: "120x60x45", unit: "cm", price: 15000, quantity: 1, included: true },
        { id: "item3", name: "TV Unit", description: "Wall mounted", size: "180x45x40", unit: "cm", price: 25000, quantity: 1, included: true },
      ]
    },
    {
      id: "room2",
      name: "Bedroom",
      icon: "bed",
      items: [
        { id: "item4", name: "Queen Bed", description: "Upholstered headboard", size: "200x180", unit: "cm", price: 35000, quantity: 1, included: true },
        { id: "item5", name: "Wardrobe", description: "4-door sliding", size: "240x210x60", unit: "cm", price: 40000, quantity: 1, included: true },
        { id: "item6", name: "Nightstand", description: "2 drawer", size: "45x45x50", unit: "cm", price: 8000, quantity: 2, included: true },
      ]
    },
    {
      id: "room3",
      name: "Kitchen",
      icon: "chefHat",
      items: [
        { id: "item7", name: "Modular Kitchen", description: "L-shaped", size: "Standard", unit: "Set", price: 80000, quantity: 1, included: true },
        { id: "item8", name: "Chimney", description: "Auto clean", size: "90cm", unit: "cm", price: 15000, quantity: 1, included: true },
        { id: "item9", name: "Hob", description: "4 burner", size: "Standard", unit: "Set", price: 12000, quantity: 1, included: true },
      ]
    },
    {
      id: "room4",
      name: "Dining Room",
      icon: "doorOpen",
      items: [
        { id: "item10", name: "Dining Table", description: "6-seater", size: "180x90x75", unit: "cm", price: 30000, quantity: 1, included: true },
        { id: "item11", name: "Dining Chairs", description: "Upholstered", size: "Standard", unit: "Set", price: 12000, quantity: 6, included: true },
      ]
    },
    {
      id: "room5",
      name: "Study Room",
      icon: "briefcase",
      items: [
        { id: "item12", name: "Study Table", description: "Wooden", size: "120x60x75", unit: "cm", price: 18000, quantity: 1, included: true },
        { id: "item13", name: "Bookshelf", description: "5-tier", size: "90x180x30", unit: "cm", price: 22000, quantity: 1, included: true },
      ]
    },
    {
      id: "room6",
      name: "Kids Room",
      icon: "baby",
      items: [
        { id: "item14", name: "Kids Bed", description: "Bunk bed", size: "200x120", unit: "cm", price: 28000, quantity: 1, included: true },
        { id: "item15", name: "Study Desk", description: "With storage", size: "90x50x75", unit: "cm", price: 12000, quantity: 1, included: true },
      ]
    },
  ];

  // Filter rooms based on package
  if (packageId === "basic") {
    return allRooms.slice(0, 3);
  } else if (packageId === "regular") {
    return allRooms.slice(0, 4);
  } else if (packageId === "luxury") {
    return allRooms;
  }
  return allRooms;
};