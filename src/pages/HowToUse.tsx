// src/pages/Masters/HowToUse.tsx
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  MapPin,
  Users,
  Settings,
  UserPlus,
  ClipboardList,
  FileText,
  Package,
  Home,
  ShoppingBag,
  TrendingUp,
  Mail,
  Phone,
  MapPin as MapPinIcon,
  HelpCircle,
  Star,
  Building2,
  Calendar,
  ThumbsUp,
  MessageCircle,
  CheckCheck,
  ArrowRight,
  Briefcase,
  Layers,
  Ruler,
  DollarSign,
  Clock,
  Shield,
  Award
} from "lucide-react";

type Language = "english" | "gujarati" | "hindi";

interface Step {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  steps: Step[];
  subSections?: Section[];
}

interface HowToUseData {
  title: string;
  subtitle: string;
  introduction: string;
  sections: Section[];
  tips: string[];
  support: {
    email: string;
    phone: string;
    address: string;
  };
}

const contentData: Record<Language, HowToUseData> = {
  english: {
    title: "How to Use the System",
    subtitle: "Complete workflow guide from setup to quotation generation",
    introduction: "Welcome to our Interior Design Management System! This comprehensive guide will walk you through the entire workflow - from initial setup to creating professional quotations for your clients.",
    sections: [
      {
        id: "location-setup",
        title: "1. Location Setup",
        icon: <MapPin className="h-5 w-5" />,
        steps: [
          {
            title: "Add States",
            description: "First, add all the states where your business operates. This helps in organizing client locations and service areas."
          },
          {
            title: "Add Cities",
            description: "Under each state, add the cities where you have clients or provide services. This creates a hierarchical location structure."
          },
          {
            title: "Add Area Names",
            description: "For each city, add specific areas, localities, or neighborhoods. This helps in precise location identification for client addresses and service delivery."
          }
        ]
      },
      {
        id: "master-setup",
        title: "2. Master Setup",
        icon: <Settings className="h-5 w-5" />,
        steps: [
          {
            title: "Employee Management",
            description: "Add all your employees and team members to the system. Each employee can have specific roles and responsibilities."
          },
          {
            title: "Login Permissions",
            description: "For each employee, you can select specific permissions for different modules. Control who can view, add, edit, or delete data."
          },
          {
            title: "Lead Sources",
            description: "Define various lead sources (like Website, Referral, Social Media, Walk-in, etc.) to track where your clients are coming from."
          },
          {
            title: "Units & Measurements",
            description: "Set up measurement units (feet, inches, meters, square feet, etc.) that will be used throughout the system."
          },
          {
            title: "Brand Management",
            description: "Add brands that you work with. This helps in organizing products by their manufacturers."
          },
          {
            title: "Raw Material Types",
            description: "Categorize your raw materials into types (like Wood, Metal, Fabric, Paint, etc.) for better organization."
          },
          {
            title: "Raw Materials",
            description: "Add all raw materials with their types, units, and pricing. These will be used in product creation."
          },
          {
            title: "Product Categories",
            description: "Create categories for your products (like Furniture, Lighting, Flooring, Wallpaper, etc.)."
          },
          {
            title: "Products",
            description: "Add your products with descriptions, images, dimensions, pricing, GST, and raw material composition."
          },
          {
            title: "Room Types",
            description: "Define room types (Living Room, Bedroom, Kitchen, Bathroom, etc.) that will be used in quotations."
          },
          {
            title: "Packages",
            description: "Create service packages that combine multiple rooms, products, and services into a single offering."
          },
          {
            title: "Terms & Conditions",
            description: "Define standard terms and conditions that will be automatically included in all quotations."
          }
        ]
      },
      {
        id: "client-management",
        title: "3. Client Management",
        icon: <UserPlus className="h-5 w-5" />,
        steps: [
          {
            title: "Add Client",
            description: "Add new clients with their details - name, contact information, address, and other relevant details."
          },
          {
            title: "Client Search",
            description: "Quickly search and find existing clients using their name, phone number, or email."
          },
          {
            title: "Client History",
            description: "View complete history of all quotations and projects for each client."
          }
        ]
      },
      {
        id: "quotation-creation",
        title: "4. Creating a Quotation",
        icon: <FileText className="h-5 w-5" />,
        steps: [
          {
            title: "Select Customer",
            description: "Start by selecting the client/customer from your client list for whom you want to create a quotation."
          },
          {
            title: "Select Package",
            description: "Choose a package that best fits the client's requirements. Packages combine multiple rooms and services."
          },
          {
            title: "Select Rooms",
            description: "From the selected package, choose which rooms need to be included in this quotation."
          },
          {
            title: "Room-wise Product Selection",
            description: "For each selected room, you'll see relevant products. Select the products that match the client's requirements."
          },
          {
            title: "Enter Dimensions",
            description: "For each selected product, enter the dimensions (Height, Width, Length) as per the client's space requirements."
          },
          {
            title: "Review Quotation",
            description: "Review all selected items, quantities, dimensions, and total cost. Make any necessary adjustments."
          },
          {
            title: "Generate Quotation",
            description: "Click 'Generate Quotation' to create a professional quotation document with all details, pricing, and terms."
          }
        ]
      },
      {
        id: "quotation-management",
        title: "5. Quotation Management",
        icon: <ClipboardList className="h-5 w-5" />,
        steps: [
          {
            title: "Send to Client",
            description: "Send the quotation to your client via email or WhatsApp directly from the system."
          },
          {
            title: "Client Approval",
            description: "Once the client receives the quotation, they can review and approve it. Track the approval status."
          },
          {
            title: "Status Update",
            description: "After client approval, update the quotation status to 'Approved' in the system."
          },
          {
            title: "Convert to Project",
            description: "Approved quotations can be converted into projects for execution and tracking."
          }
        ]
      },
      {
        id: "follow-up",
        title: "6. Follow-up & Tracking",
        icon: <Calendar className="h-5 w-5" />,
        steps: [
          {
            title: "Schedule Follow-ups",
            description: "Set up follow-up reminders for clients to ensure timely communication and closure."
          },
          {
            title: "Track Status",
            description: "Monitor the status of all quotations - Sent, Viewed, Approved, Rejected, or Converted."
          },
          {
            title: "Lead Management",
            description: "Track leads from various sources and their conversion rates to improve your business strategy."
          },
          {
            title: "Analytics Dashboard",
            description: "View key metrics like total quotations, conversion rate, revenue, and more."
          }
        ]
      }
    ],
    tips: [
      "Always keep your master data (products, materials, brands) up to date for accurate quotations.",
      "Use the search functionality to quickly find clients, products, or quotations.",
      "Regularly review your lead sources to understand which marketing channels work best.",
      "Set up employee permissions carefully to ensure data security and proper access control.",
      "Use package templates to save time when creating similar quotations for different clients.",
      "Always get client approval before starting any project work."
    ],
    support: {
      email: "support@interiordesign.com",
      phone: "+91 1234567890",
      address: "123, Design District, Mumbai, India"
    }
  },
  gujarati: {
    title: "સિસ્ટમનો ઉપયોગ કેવી રીતે કરવો",
    subtitle: "સેટઅપથી ક્વોટેશન જનરેશન સુધીની સંપૂર્ણ વર્કફ્લો માર્ગદર્શિકા",
    introduction: "અમારા ઇન્ટીરિયર ડિઝાઇન મેનેજમેન્ટ સિસ્ટમમાં આપનું સ્વાગત છે! આ વ્યાપક માર્ગદર્શિકા તમને સંપૂર્ણ વર્કફ્લો - શરૂઆતના સેટઅપથી લઈને તમારા ક્લાયન્ટ્સ માટે વ્યાવસાયિક ક્વોટેશન બનાવવા સુધી માર્ગદર્શન આપશે.",
    sections: [
      {
        id: "location-setup",
        title: "૧. સ્થાન સેટઅપ",
        icon: <MapPin className="h-5 w-5" />,
        steps: [
          {
            title: "રાજ્યો ઉમેરો",
            description: "પ્રથમ, તે બધા રાજ્યો ઉમેરો જ્યાં તમારો વ્યવસાય કાર્યરત છે. આ ક્લાયન્ટ સ્થાનો અને સેવા વિસ્તારોને ગોઠવવામાં મદદ કરે છે."
          },
          {
            title: "શહેરો ઉમેરો",
            description: "દરેક રાજ્ય હેઠળ, તે શહેરો ઉમેરો જ્યાં તમારા ક્લાયન્ટ્સ છે અથવા તમે સેવાઓ પ્રદાન કરો છો. આ એક વંશવેલો સ્થાન માળખું બનાવે છે."
          },
          {
            title: "વિસ્તારના નામો ઉમેરો",
            description: "દરેક શહેર માટે, ચોક્કસ વિસ્તારો, વિસ્તારો અથવા પડોશીઓ ઉમેરો. આ ક્લાયન્ટ સરનામાં અને સેવા વિતરણ માટે ચોક્કસ સ્થાન ઓળખમાં મદદ કરે છે."
          }
        ]
      },
      {
        id: "master-setup",
        title: "૨. માસ્ટર સેટઅપ",
        icon: <Settings className="h-5 w-5" />,
        steps: [
          {
            title: "કર્મચારી વ્યવસ્થાપન",
            description: "સિસ્ટમમાં તમારા બધા કર્મચારીઓ અને ટીમના સભ્યોને ઉમેરો. દરેક કર્મચારી પાસે ચોક્કસ ભૂમિકાઓ અને જવાબદારીઓ હોઈ શકે છે."
          },
          {
            title: "લૉગિન પરવાનગીઓ",
            description: "દરેક કર્મચારી માટે, તમે વિવિધ મોડ્યુલો માટે ચોક્કસ પરવાનગીઓ પસંદ કરી શકો છો. કોણ ડેટા જોઈ, ઉમેરી, સંપાદિત અથવા કાઢી શકે છે તે નિયંત્રિત કરો."
          },
          {
            title: "લીડ સ્ત્રોતો",
            description: "વિવિધ લીડ સ્ત્રોતો (જેમ કે વેબસાઇટ, રેફરલ, સોશિયલ મીડિયા, વૉક-ઇન, વગેરે) વ્યાખ્યાયિત કરો કે જેથી તમારા ક્લાયન્ટ્સ ક્યાંથી આવી રહ્યા છે તે ટ્રૅક કરી શકાય."
          },
          {
            title: "એકમો અને માપ",
            description: "માપન એકમો (ફૂટ, ઇંચ, મીટર, સ્ક્વેર ફૂટ, વગેરે) સેટ કરો જે સમગ્ર સિસ્ટમમાં ઉપયોગમાં લેવાશે."
          },
          {
            title: "બ્રાંડ વ્યવસ્થાપન",
            description: "તમે જે બ્રાન્ડ્સ સાથે કામ કરો છો તે ઉમેરો. આ તેમના ઉત્પાદકો દ્વારા ઉત્પાદનોને ગોઠવવામાં મદદ કરે છે."
          },
          {
            title: "કાચા માલના પ્રકારો",
            description: "તમારા કાચા માલને પ્રકારોમાં વર્ગીકૃત કરો (જેમ કે લાકડું, ધાતુ, ફેબ્રિક, પેઇન્ટ, વગેરે) વધુ સારી સંસ્થા માટે."
          },
          {
            title: "કાચો માલ",
            description: "તેમના પ્રકારો, એકમો અને કિંમતો સાથે તમામ કાચા માલ ઉમેરો. આ ઉત્પાદન નિર્માણમાં ઉપયોગમાં લેવાશે."
          },
          {
            title: "ઉત્પાદન શ્રેણીઓ",
            description: "તમારા ઉત્પાદનો માટે શ્રેણીઓ બનાવો (જેમ કે ફર્નિચર, લાઇટિંગ, ફ્લોરિંગ, વૉલપેપર, વગેરે)."
          },
          {
            title: "ઉત્પાદનો",
            description: "તમારા ઉત્પાદનોને વર્ણન, છબીઓ, પરિમાણો, કિંમત, જીએસટી અને કાચા માલની રચના સાથે ઉમેરો."
          },
          {
            title: "રૂમ પ્રકારો",
            description: "રૂમ પ્રકારો (લિવિંગ રૂમ, બેડરૂમ, કિચન, બાથરૂમ, વગેરે) વ્યાખ્યાયિત કરો જે ક્વોટેશનમાં ઉપયોગમાં લેવાશે."
          },
          {
            title: "પેકેજો",
            description: "સેવા પેકેજો બનાવો જે બહુવિધ રૂમ, ઉત્પાદનો અને સેવાઓને એક જ ઓફરિંગમાં જોડે છે."
          },
          {
            title: "નિયમો અને શરતો",
            description: "પ્રમાણભૂત નિયમો અને શરતો વ્યાખ્યાયિત કરો જે તમામ ક્વોટેશનમાં આપમેળે સામેલ કરવામાં આવશે."
          }
        ]
      },
      {
        id: "client-management",
        title: "૩. ક્લાયન્ટ વ્યવસ્થાપન",
        icon: <UserPlus className="h-5 w-5" />,
        steps: [
          {
            title: "ક્લાયન્ટ ઉમેરો",
            description: "નવા ક્લાયન્ટ્સને તેમની વિગતો - નામ, સંપર્ક માહિતી, સરનામું અને અન્ય સંબંધિત વિગતો સાથે ઉમેરો."
          },
          {
            title: "ક્લાયન્ટ શોધ",
            description: "તેમના નામ, ફોન નંબર અથવા ઇમેઇલનો ઉપયોગ કરીને અસ્તિત્વમાં રહેલા ક્લાયન્ટ્સને ઝડપથી શોધો."
          },
          {
            title: "ક્લાયન્ટ ઇતિહાસ",
            description: "દરેક ક્લાયન્ટ માટે તમામ ક્વોટેશન અને પ્રોજેક્ટ્સનો સંપૂર્ણ ઇતિહાસ જુઓ."
          }
        ]
      },
      {
        id: "quotation-creation",
        title: "૪. ક્વોટેશન બનાવવું",
        icon: <FileText className="h-5 w-5" />,
        steps: [
          {
            title: "ગ્રાહક પસંદ કરો",
            description: "તમારી ક્લાયન્ટ યાદીમાંથી તે ગ્રાહક/ક્લાયન્ટ પસંદ કરીને શરૂ કરો જેના માટે તમે ક્વોટેશન બનાવવા માંગો છો."
          },
          {
            title: "પેકેજ પસંદ કરો",
            description: "એક પેકેજ પસંદ કરો જે ગ્રાહકની જરૂરિયાતોને શ્રેષ્ઠ રીતે બંધબેસે છે. પેકેજો બહુવિધ રૂમ અને સેવાઓને જોડે છે."
          },
          {
            title: "રૂમ પસંદ કરો",
            description: "પસંદ કરેલ પેકેજમાંથી, આ ક્વોટેશનમાં કયા રૂમનો સમાવેશ કરવાની જરૂર છે તે પસંદ કરો."
          },
          {
            title: "રૂમ-વાઇઝ ઉત્પાદન પસંદગી",
            description: "દરેક પસંદ કરેલ રૂમ માટે, તમને સંબંધિત ઉત્પાદનો દેખાશે. ગ્રાહકની જરૂરિયાતો સાથે મેળ ખાતા ઉત્પાદનો પસંદ કરો."
          },
          {
            title: "પરિમાણો દાખલ કરો",
            description: "દરેક પસંદ કરેલ ઉત્પાદન માટે, ગ્રાહકની જગ્યાની જરૂરિયાતો અનુસાર પરિમાણો (ઊંચાઈ, પહોળાઈ, લંબાઈ) દાખલ કરો."
          },
          {
            title: "ક્વોટેશન સમીક્ષા કરો",
            description: "તમામ પસંદ કરેલ વસ્તુઓ, માત્રા, પરિમાણો અને કુલ કિંમત સમીક્ષા કરો. કોઈપણ જરૂરી ગોઠવણો કરો."
          },
          {
            title: "ક્વોટેશન જનરેટ કરો",
            description: "તમામ વિગતો, કિંમત અને શરતો સાથે વ્યાવસાયિક ક્વોટેશન દસ્તાવેજ બનાવવા માટે 'ક્વોટેશન જનરેટ કરો' ક્લિક કરો."
          }
        ]
      },
      {
        id: "quotation-management",
        title: "૫. ક્વોટેશન વ્યવસ્થાપન",
        icon: <ClipboardList className="h-5 w-5" />,
        steps: [
          {
            title: "ક્લાયન્ટને મોકલો",
            description: "સિસ્ટમમાંથી સીધા જ ઇમેઇલ અથવા WhatsApp દ્વારા ક્વોટેશન તમારા ક્લાયન્ટને મોકલો."
          },
          {
            title: "ક્લાયન્ટ મંજૂરી",
            description: "એકવાર ક્લાયન્ટને ક્વોટેશન પ્રાપ્ત થાય પછી, તે સમીક્ષા કરી શકે છે અને મંજૂર કરી શકે છે. મંજૂરી સ્થિતિ ટ્રૅક કરો."
          },
          {
            title: "સ્થિતિ અપડેટ",
            description: "ક્લાયન્ટ મંજૂરી પછી, સિસ્ટમમાં ક્વોટેશન સ્થિતિને 'મંજૂર' માં અપડેટ કરો."
          },
          {
            title: "પ્રોજેક્ટમાં કન્વર્ટ કરો",
            description: "મંજૂર ક્વોટેશનને અમલ અને ટ્રૅકિંગ માટે પ્રોજેક્ટ્સમાં કન્વર્ટ કરી શકાય છે."
          }
        ]
      },
      {
        id: "follow-up",
        title: "૬. ફોલો-અપ અને ટ્રૅકિંગ",
        icon: <Calendar className="h-5 w-5" />,
        steps: [
          {
            title: "ફોલો-અપ શેડ્યૂલ કરો",
            description: "સમયસર સંચાર અને બંધ થવાની ખાતરી કરવા માટે ક્લાયન્ટ્સ માટે ફોલો-અપ રિમાઇન્ડર સેટ કરો."
          },
          {
            title: "સ્થિતિ ટ્રૅક કરો",
            description: "તમામ ક્વોટેશનની સ્થિતિ મોનિટર કરો - મોકલેલ, જોયેલ, મંજૂર, નકારેલ અથવા કન્વર્ટેડ."
          },
          {
            title: "લીડ વ્યવસ્થાપન",
            description: "વિવિધ સ્ત્રોતોમાંથી લીડ્સ અને તેમના રૂપાંતરણ દરો ટ્રૅક કરો જેથી તમારી વ્યવસાય વ્યૂહરચના સુધારી શકાય."
          },
          {
            title: "એનાલિટિક્સ ડેશબોર્ડ",
            description: "કુલ ક્વોટેશન, રૂપાંતરણ દર, આવક અને વધુ જેવા મુખ્ય મેટ્રિક્સ જુઓ."
          }
        ]
      }
    ],
    tips: [
      "સચોટ ક્વોટેશન માટે તમારા માસ્ટર ડેટા (ઉત્પાદનો, સામગ્રી, બ્રાન્ડ્સ) હંમેશા અપડેટ રાખો.",
      "ક્લાયન્ટ્સ, ઉત્પાદનો અથવા ક્વોટેશન ઝડપથી શોધવા માટે શોધ કાર્યક્ષમતાનો ઉપયોગ કરો.",
      "કયા માર્કેટિંગ ચેનલો શ્રેષ્ઠ કામ કરે છે તે સમજવા માટે તમારા લીડ સ્ત્રોતોની નિયમિત સમીક્ષા કરો.",
      "ડેટા સુરક્ષા અને યોગ્ય ઍક્સેસ નિયંત્રણ સુનિશ્ચિત કરવા માટે કર્મચારી પરવાનગીઓ કાળજીપૂર્વક સેટ કરો.",
      "વિવિધ ક્લાયન્ટ્સ માટે સમાન ક્વોટેશન બનાવતી વખતે સમય બચાવવા માટે પેકેજ ટેમ્પ્લેટનો ઉપયોગ કરો.",
      "કોઈપણ પ્રોજેક્ટ કાર્ય શરૂ કરતા પહેલા હંમેશા ક્લાયન્ટની મંજૂરી મેળવો."
    ],
    support: {
      email: "support@interiordesign.com",
      phone: "+91 1234567890",
      address: "123, ડિઝાઇન ડિસ્ટ્રિક્ટ, મુંબઈ, ભારત"
    }
  },
  hindi: {
    title: "सिस्टम का उपयोग कैसे करें",
    subtitle: "सेटअप से कोटेशन जनरेशन तक की पूरी वर्कफ्लो गाइड",
    introduction: "हमारे इंटीरियर डिजाइन प्रबंधन सिस्टम में आपका स्वागत है! यह व्यापक गाइड आपको पूरी वर्कफ्लो - शुरुआती सेटअप से लेकर आपके ग्राहकों के लिए पेशेवर कोटेशन बनाने तक मार्गदर्शन करेगी।",
    sections: [
      {
        id: "location-setup",
        title: "१. स्थान सेटअप",
        icon: <MapPin className="h-5 w-5" />,
        steps: [
          {
            title: "राज्य जोड़ें",
            description: "पहले, उन सभी राज्यों को जोड़ें जहां आपका व्यवसाय संचालित होता है। यह ग्राहक स्थानों और सेवा क्षेत्रों को व्यवस्थित करने में मदद करता है।"
          },
          {
            title: "शहर जोड़ें",
            description: "प्रत्येक राज्य के अंतर्गत, उन शहरों को जोड़ें जहां आपके ग्राहक हैं या आप सेवाएं प्रदान करते हैं। यह एक पदानुक्रमित स्थान संरचना बनाता है।"
          },
          {
            title: "क्षेत्र के नाम जोड़ें",
            description: "प्रत्येक शहर के लिए, विशिष्ट क्षेत्रों, इलाकों या पड़ोस को जोड़ें। यह ग्राहक पते और सेवा वितरण के लिए सटीक स्थान पहचान में मदद करता है।"
          }
        ]
      },
      {
        id: "master-setup",
        title: "२. मास्टर सेटअप",
        icon: <Settings className="h-5 w-5" />,
        steps: [
          {
            title: "कर्मचारी प्रबंधन",
            description: "सिस्टम में अपने सभी कर्मचारियों और टीम के सदस्यों को जोड़ें। प्रत्येक कर्मचारी की विशिष्ट भूमिकाएं और जिम्मेदारियां हो सकती हैं।"
          },
          {
            title: "लॉगिन अनुमतियाँ",
            description: "प्रत्येक कर्मचारी के लिए, आप विभिन्न मॉड्यूल के लिए विशिष्ट अनुमतियाँ चुन सकते हैं। कौन डेटा देख, जोड़, संपादित या हटा सकता है, इसे नियंत्रित करें।"
          },
          {
            title: "लीड स्रोत",
            description: "विभिन्न लीड स्रोतों (जैसे वेबसाइट, रेफरल, सोशल मीडिया, वॉक-इन, आदि) को परिभाषित करें ताकि आपके ग्राहक कहां से आ रहे हैं, इसका पता लगाया जा सके।"
          },
          {
            title: "इकाइयाँ और माप",
            description: "माप इकाइयाँ (फीट, इंच, मीटर, वर्ग फीट, आदि) सेट करें जो पूरे सिस्टम में उपयोग की जाएंगी।"
          },
          {
            title: "ब्रांड प्रबंधन",
            description: "जिन ब्रांडों के साथ आप काम करते हैं, उन्हें जोड़ें। यह उनके निर्माताओं द्वारा उत्पादों को व्यवस्थित करने में मदद करता है।"
          },
          {
            title: "कच्चे माल के प्रकार",
            description: "अपने कच्चे माल को प्रकारों में वर्गीकृत करें (जैसे लकड़ी, धातु, कपड़ा, पेंट, आदि) बेहतर संगठन के लिए।"
          },
          {
            title: "कच्चा माल",
            description: "सभी कच्चे माल को उनके प्रकार, इकाइयों और मूल्य निर्धारण के साथ जोड़ें। ये उत्पाद निर्माण में उपयोग किए जाएंगे।"
          },
          {
            title: "उत्पाद श्रेणियाँ",
            description: "अपने उत्पादों के लिए श्रेणियाँ बनाएं (जैसे फर्नीचर, लाइटिंग, फ्लोरिंग, वॉलपेपर, आदि)।"
          },
          {
            title: "उत्पाद",
            description: "अपने उत्पादों को विवरण, छवियां, आयाम, मूल्य, जीएसटी और कच्चे माल की संरचना के साथ जोड़ें।"
          },
          {
            title: "रूम प्रकार",
            description: "रूम प्रकार (लिविंग रूम, बेडरूम, किचन, बाथरूम, आदि) परिभाषित करें जो कोटेशन में उपयोग किए जाएंगे।"
          },
          {
            title: "पैकेज",
            description: "सेवा पैकेज बनाएं जो कई रूम, उत्पादों और सेवाओं को एक ही पेशकश में जोड़ते हैं।"
          },
          {
            title: "नियम और शर्तें",
            description: "मानक नियम और शर्तें परिभाषित करें जो सभी कोटेशन में स्वचालित रूप से शामिल किए जाएंगे।"
          }
        ]
      },
      {
        id: "client-management",
        title: "३. ग्राहक प्रबंधन",
        icon: <UserPlus className="h-5 w-5" />,
        steps: [
          {
            title: "ग्राहक जोड़ें",
            description: "नए ग्राहकों को उनके विवरण - नाम, संपर्क जानकारी, पता और अन्य प्रासंगिक विवरण के साथ जोड़ें।"
          },
          {
            title: "ग्राहक खोज",
            description: "उनके नाम, फोन नंबर या ईमेल का उपयोग करके मौजूदा ग्राहकों को जल्दी से खोजें।"
          },
          {
            title: "ग्राहक इतिहास",
            description: "प्रत्येक ग्राहक के लिए सभी कोटेशन और प्रोजेक्ट्स का पूरा इतिहास देखें।"
          }
        ]
      },
      {
        id: "quotation-creation",
        title: "४. कोटेशन बनाना",
        icon: <FileText className="h-5 w-5" />,
        steps: [
          {
            title: "ग्राहक चुनें",
            description: "अपनी ग्राहक सूची से उस ग्राहक/क्लाइंट को चुनकर शुरू करें जिसके लिए आप कोटेशन बनाना चाहते हैं।"
          },
          {
            title: "पैकेज चुनें",
            description: "एक पैकेज चुनें जो ग्राहक की आवश्यकताओं को सबसे अच्छी तरह से पूरा करता हो। पैकेज कई रूम और सेवाओं को जोड़ते हैं।"
          },
          {
            title: "रूम चुनें",
            description: "चयनित पैकेज से, चुनें कि इस कोटेशन में किन रूम को शामिल करने की आवश्यकता है।"
          },
          {
            title: "रूम-वाइज उत्पाद चयन",
            description: "प्रत्येक चयनित रूम के लिए, आपको संबंधित उत्पाद दिखाई देंगे। ग्राहक की आवश्यकताओं से मेल खाने वाले उत्पाद चुनें।"
          },
          {
            title: "आयाम दर्ज करें",
            description: "प्रत्येक चयनित उत्पाद के लिए, ग्राहक की जगह की आवश्यकताओं के अनुसार आयाम (ऊंचाई, चौड़ाई, लंबाई) दर्ज करें।"
          },
          {
            title: "कोटेशन समीक्षा करें",
            description: "सभी चयनित वस्तुओं, मात्रा, आयाम और कुल लागत की समीक्षा करें। कोई भी आवश्यक समायोजन करें।"
          },
          {
            title: "कोटेशन जनरेट करें",
            description: "सभी विवरण, मूल्य निर्धारण और शर्तों के साथ एक पेशेवर कोटेशन दस्तावेज़ बनाने के लिए 'कोटेशन जनरेट करें' पर क्लिक करें।"
          }
        ]
      },
      {
        id: "quotation-management",
        title: "५. कोटेशन प्रबंधन",
        icon: <ClipboardList className="h-5 w-5" />,
        steps: [
          {
            title: "ग्राहक को भेजें",
            description: "सिस्टम से सीधे ईमेल या WhatsApp के माध्यम से कोटेशन अपने ग्राहक को भेजें।"
          },
          {
            title: "ग्राहक अनुमोदन",
            description: "एक बार ग्राहक को कोटेशन प्राप्त हो जाने पर, वह समीक्षा कर सकता है और अनुमोदित कर सकता है। अनुमोदन स्थिति ट्रैक करें।"
          },
          {
            title: "स्थिति अपडेट करें",
            description: "ग्राहक अनुमोदन के बाद, सिस्टम में कोटेशन स्थिति को 'अनुमोदित' में अपडेट करें।"
          },
          {
            title: "प्रोजेक्ट में बदलें",
            description: "अनुमोदित कोटेशन को निष्पादन और ट्रैकिंग के लिए प्रोजेक्ट्स में बदला जा सकता है।"
          }
        ]
      },
      {
        id: "follow-up",
        title: "६. फॉलो-अप और ट्रैकिंग",
        icon: <Calendar className="h-5 w-5" />,
        steps: [
          {
            title: "फॉलो-अप शेड्यूल करें",
            description: "समय पर संचार और समापन सुनिश्चित करने के लिए ग्राहकों के लिए फॉलो-अप रिमाइंडर सेट करें।"
          },
          {
            title: "स्थिति ट्रैक करें",
            description: "सभी कोटेशन की स्थिति मॉनिटर करें - भेजा, देखा, अनुमोदित, अस्वीकृत या परिवर्तित।"
          },
          {
            title: "लीड प्रबंधन",
            description: "विभिन्न स्रोतों से लीड्स और उनकी रूपांतरण दरों को ट्रैक करें ताकि अपनी व्यावसायिक रणनीति सुधार सकें।"
          },
          {
            title: "एनालिटिक्स डैशबोर्ड",
            description: "कुल कोटेशन, रूपांतरण दर, राजस्व और अधिक जैसे प्रमुख मेट्रिक्स देखें।"
          }
        ]
      }
    ],
    tips: [
      "सटीक कोटेशन के लिए अपने मास्टर डेटा (उत्पाद, सामग्री, ब्रांड) को हमेशा अपडेट रखें।",
      "ग्राहकों, उत्पादों या कोटेशन को जल्दी से खोजने के लिए खोज कार्यक्षमता का उपयोग करें।",
      "कौन से मार्केटिंग चैनल सबसे अच्छा काम करते हैं, यह समझने के लिए अपने लीड स्रोतों की नियमित समीक्षा करें।",
      "डेटा सुरक्षा और उचित पहुंच नियंत्रण सुनिश्चित करने के लिए कर्मचारी अनुमतियाँ सावधानीपूर्वक सेट करें।",
      "विभिन्न ग्राहकों के लिए समान कोटेशन बनाते समय समय बचाने के लिए पैकेज टेम्पलेट्स का उपयोग करें।",
      "किसी भी प्रोजेक्ट कार्य को शुरू करने से पहले हमेशा ग्राहक की अनुमोदन प्राप्त करें।"
    ],
    support: {
      email: "support@interiordesign.com",
      phone: "+91 1234567890",
      address: "123, डिजाइन डिस्ट्रिक्ट, मुंबई, भारत"
    }
  }
};

const languageOptions = [
  { value: "english", label: "English", flag: "🇬🇧" },
  { value: "gujarati", label: "ગુજરાતી", flag: "🇮🇳" },
  { value: "hindi", label: "हिन्दी", flag: "🇮🇳" }
];

export default function HowToUse() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("english");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const content = contentData[selectedLanguage];

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  useEffect(() => {
    const allIds = content.sections.map(s => s.id);
    setExpandedSections(new Set(allIds));
  }, [selectedLanguage]);

  const filteredSections = content.sections.filter(section => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const matchTitle = section.title.toLowerCase().includes(searchLower);
    const matchSteps = section.steps.some(step => 
      step.title.toLowerCase().includes(searchLower) ||
      step.description.toLowerCase().includes(searchLower)
    );
    return matchTitle || matchSteps;
  });

  // Workflow steps for the bottom section
  const workflowSteps = [
    { icon: <MapPinIcon className="h-5 w-5" />, label: "Location Setup" },
    { icon: <Settings className="h-5 w-5" />, label: "Master Setup" },
    { icon: <UserPlus className="h-5 w-5" />, label: "Add Client" },
    { icon: <FileText className="h-5 w-5" />, label: "Create Quotation" },
    { icon: <Mail className="h-5 w-5" />, label: "Send & Approve" },
    { icon: <ThumbsUp className="h-5 w-5" />, label: "Project Start" },
  ];

  return (
    <MainLayout 
      title={content.title} 
      subtitle={content.subtitle}
    >
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        {/* Language Selector */}
        <div className="flex flex-wrap gap-2 mb-6 bg-card rounded-2xl border p-2">
          {languageOptions.map((lang) => (
            <Button
              key={lang.value}
              variant={selectedLanguage === lang.value ? "default" : "ghost"}
              className={`rounded-xl px-4 py-2 h-auto gap-2 flex-1 sm:flex-none ${
                selectedLanguage === lang.value 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted"
              }`}
              onClick={() => setSelectedLanguage(lang.value as Language)}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="font-medium">{lang.label}</span>
            </Button>
          ))}
        </div>

        {/* Quick Workflow Overview */}
        <Card className="rounded-2xl border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {content.introduction}
                </p>
              </div>
            </div>
            
            {/* Workflow Steps */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t">
              {workflowSteps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 border text-xs font-medium">
                    <span className="text-primary">{step.icon}</span>
                    <span>{step.label}</span>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 mx-1" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-11 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {filteredSections.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No results found for "{searchTerm}"</p>
            </div>
          ) : (
            filteredSections.map((section) => (
              <Card key={section.id} className="rounded-2xl border overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      {section.icon}
                    </div>
                    <span className="font-semibold text-base">{section.title}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {section.steps.length} steps
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {expandedSections.has(section.id) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </button>

                {expandedSections.has(section.id) && (
                  <div className="px-5 pb-5 pt-1 border-t">
                    <div className="space-y-4">
                      {section.steps.map((step, index) => (
                        <div key={index} className="flex gap-4 group">
                          <div className="flex flex-col items-center">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                              {index + 1}
                            </div>
                            {index < section.steps.length - 1 && (
                              <div className="w-px h-full bg-border group-last:hidden" />
                            )}
                          </div>
                          <div className="flex-1 pt-1 pb-3">
                            <h4 className="font-medium text-sm mb-1">{step.title}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-card rounded-2xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Star className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg">Pro Tips</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {content.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2 p-3 rounded-xl bg-muted/30">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 bg-card rounded-2xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg">Need Help?</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
              <Mail className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">sales@sunshineinfotech.in</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
              <Phone className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">8200043151</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
              <Phone className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">9316392980</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground/50 border-t pt-4">
          <p>© {new Date().getFullYear()} Interior Design Management System. All rights reserved.</p>
        </div>
      </div>
    </MainLayout>
  );
}