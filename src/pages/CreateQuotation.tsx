import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Package,
  Home,
  ClipboardList,
  FileCheck,
  Download,
  Mail,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StepClientSelection } from "@/components/quotation/StepClientSelection";
import { StepPackageSelection } from "@/components/quotation/StepPackageSelection";
import { StepRoomSelection } from "@/components/quotation/StepRoomSelection";
import { StepItemSelection } from "@/components/quotation/StepItemSelection";
import { StepSummary } from "@/components/quotation/StepSummary";
import { StepGenerate } from "@/components/quotation/StepGenerate";
import {
  Client,
  Package as PackageType,
  Room,
  sampleClients,
  packages,
  getRoomsByPackage,
} from "@/data/quotationData";

const steps = [
  { id: 1, name: "Client", icon: User },
  { id: 2, name: "Package", icon: Package },
  { id: 3, name: "Rooms", icon: Home },
  { id: 4, name: "Items", icon: ClipboardList },
  { id: 5, name: "Summary", icon: FileCheck },
  { id: 6, name: "Generate", icon: Download },
];

export default function CreateQuotation() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);

  const handlePackageSelect = (pkg: PackageType) => {
    setSelectedPackage(pkg);
    const newRooms = getRoomsByPackage(pkg.id);
    setRooms(newRooms);
    setExpandedRooms([newRooms[0]?.id || ""]);
  };

  const updateRoomItem = (
    roomId: string,
    itemId: string,
    updates: Partial<{ quantity: number; included: boolean; price: number }>
  ) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? {
              ...room,
              items: room.items.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            }
          : room
      )
    );
  };

  const { subtotal, tax, grandTotal } = useMemo(() => {
    const sub = rooms.reduce(
      (acc, room) =>
        acc +
        room.items
          .filter((item) => item.included)
          .reduce((sum, item) => sum + item.price * item.quantity, 0),
      0
    );
    const taxAmount = sub * 0.18; // 18% GST
    return {
      subtotal: sub,
      tax: taxAmount,
      grandTotal: sub + taxAmount,
    };
  }, [rooms]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedClient !== null;
      case 2:
        return selectedPackage !== null;
      case 3:
        return rooms.length > 0;
      case 4:
        return rooms.some((r) => r.items.some((i) => i.included));
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepClientSelection
            clients={sampleClients}
            selectedClient={selectedClient}
            onSelectClient={setSelectedClient}
          />
        );
      case 2:
        return (
          <StepPackageSelection
            packages={packages}
            selectedPackage={selectedPackage}
            onSelectPackage={handlePackageSelect}
          />
        );
      case 3:
        return (
          <StepRoomSelection
            rooms={rooms}
            expandedRooms={expandedRooms}
            setExpandedRooms={setExpandedRooms}
          />
        );
      case 4:
        return (
          <StepItemSelection
            rooms={rooms}
            expandedRooms={expandedRooms}
            setExpandedRooms={setExpandedRooms}
            updateRoomItem={updateRoomItem}
          />
        );
      case 5:
        return (
          <StepSummary
            client={selectedClient}
            selectedPackage={selectedPackage}
            rooms={rooms}
            subtotal={subtotal}
            tax={tax}
            grandTotal={grandTotal}
          />
        );
      case 6:
        return (
          <StepGenerate
            client={selectedClient}
            selectedPackage={selectedPackage}
            grandTotal={grandTotal}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout
      title="Create Quotation"
      subtitle="Build a professional quotation step by step"
    >
      <div className="max-w-6xl mx-auto animate-fade-in">
        {/* Progress Steps */}
        <Card className="p-6 mb-6 bg-card border-border shadow-soft">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center",
                  index < steps.length - 1 && "flex-1"
                )}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                      currentStep === step.id
                        ? "bg-primary text-primary-foreground shadow-lg scale-110"
                        : currentStep > step.id
                        ? "bg-success text-success-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium hidden sm:block",
                      currentStep === step.id
                        ? "text-primary"
                        : currentStep > step.id
                        ? "text-success"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-1 mx-2 rounded-full transition-colors duration-300",
                      currentStep > step.id ? "bg-success" : "bg-secondary"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress
            value={(currentStep / steps.length) * 100}
            className="h-1.5"
          />
        </Card>

        {/* Step Content */}
        <div className="mb-6">{renderStep()}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentStep < 6 ? (
            <Button
              onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
              disabled={!canProceed()}
              className="gap-2"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button variant="outline" className="gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Button>
              <Button className="gap-2 bg-success hover:bg-success/90">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
