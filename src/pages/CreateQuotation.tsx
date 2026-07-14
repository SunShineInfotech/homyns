// src/pages/CreateQuotation.tsx
import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
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
import { toast } from "@/hooks/use-toast";

const steps = [
  { id: 1, name: "Client", icon: User, path: "client" },
  { id: 2, name: "Package", icon: Package, path: "package" },
  { id: 3, name: "Rooms", icon: Home, path: "rooms" },
  { id: 4, name: "Items", icon: ClipboardList, path: "items" },
  { id: 5, name: "Summary", icon: FileCheck, path: "summary" },
  { id: 6, name: "Generate", icon: Download, path: "generate" },
];

// ─── Default Data ──────────────────────────────────────────────────────────
const defaultQuotationData = {
  selectedClient: null,
  selectedPackage: null,
  rooms: [],
  expandedRooms: [],
  discountType: "rs",
  discountValue: 0,
  withGst: true,
  specialInstructions: "",
};

const STORAGE_KEY = 'quotation_data';
// ─── Quotation data management ─────────────────────────────────────────────
export const getQuotationData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    console.log('📦 getQuotationData:', data);
    return data;
  } catch {
    console.error('Failed to parse quotation data');
    return null;
  }
};

export const saveQuotationData = (data: any) => {
  try {
    const existing = getQuotationData() || {};
    const merged = { ...existing, ...data };
    console.log('💾 saveQuotationData:', merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (error) {
    console.error('Failed to save quotation data:', error);
  }
};

// ─── Clear ALL quotation data ─────────────────────────────────────────────
export const clearQuotationData = () => {
  console.log('🗑️ Clearing quotation data');
  localStorage.removeItem(STORAGE_KEY);
};

export default function CreateQuotation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);

  // Get current step from URL
  useEffect(() => {
    const path = location.pathname.split("/").pop();
    const stepIndex = steps.findIndex((s) => s.path === path);
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex + 1);
    } else {
      // If no step in URL, navigate to client
      navigate("client", { replace: true });
    }
  }, [location.pathname]);

  const goToStep = (step: number) => {
    const path = steps[step - 1]?.path;
    if (path) {
      navigate(`/create-quotation/${path}`);
    }
  };

  const canProceed = () => {
    const data = getQuotationData();
    switch (currentStep) {
      case 1:
        return data.selectedClient !== null;
      case 2:
        return data.selectedPackage !== null;
      case 3:
        return data.rooms.length > 0;
      case 4:
        return data.rooms.some((r: any) => r.items?.some((i: any) => i.included));
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast({ title: "Please complete this step first", variant: "destructive" });
      return;
    }
    const nextStep = Math.min(currentStep + 1, 6);
    goToStep(nextStep);
  };

  const handlePrevious = () => {
    const prevStep = Math.max(currentStep - 1, 1);
    goToStep(prevStep);
  };

  // Check if we're on the summary page (step 5)
  const isSummaryStep = currentStep === 5;

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
                <div
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => goToStep(step.id)}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                      currentStep === step.id
                        ? "bg-primary text-primary-foreground shadow-lg scale-110"
                        : currentStep > step.id
                          ? "bg-success text-success-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
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

        {/* Step Content - Outlet renders the child route */}
        <div className="mb-6">
          <Outlet />
        </div>

        {/* Navigation - Hide on Summary page */}
        {!isSummaryStep && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            {currentStep < 4 ? (
              <Button onClick={handleNext} className="gap-2">
                Next Step
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : currentStep === 5 ? (
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
            ) : null}
          </div>
        )}
      </div>
    </MainLayout>
  );
}