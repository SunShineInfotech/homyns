// src/pages/quotation/StepPackage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Home, Building, Crown, Check, Loader2, SkipForward, Package, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { quotationFilterService, QuotationPackage } from "@/services/quotation_filter.service";
import { toast } from "@/hooks/use-toast";
import { getQuotationData, saveQuotationData } from "../CreateQuotation";

const packageIcons: Record<string, React.ElementType> = {
  home: Home,
  building: Building,
  crown: Crown,
};

export default function StepPackage() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<QuotationPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<QuotationPackage | null>(null);

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      return "";
    }
    return "";
  };

  useEffect(() => {
    const saved = getQuotationData();
    if (saved.selectedPackage) {
      setSelectedPackage(saved.selectedPackage);
    }

    const fetchPackages = async () => {
      setLoading(true);
      try {
        const companyId = getCompanyId();
        if (!companyId) {
          toast({ title: "Error", description: "Company not found", variant: "destructive" });
          setLoading(false);
          return;
        }
        
        // Use the new quotation filter service
        const res = await quotationFilterService.getPackages(companyId);
        
        if (res.status === "success" && res.data) {
          setPackages(res.data);
        } else {
          toast({ title: "Error", description: res.message || "Failed to load packages", variant: "destructive" });
        }
      } catch (e: any) {
        console.error('Fetch packages error:', e);
        toast({ 
          title: "Error", 
          description: e?.response?.data?.message || "Something went wrong", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleSelectPackage = (pkg: QuotationPackage) => {
    setSelectedPackage(pkg);
    saveQuotationData({ selectedPackage: pkg, resumeCart: false });
  };

  const handleNext = () => {
    if (!selectedPackage) {
      toast({ title: "Please select a package", variant: "destructive" });
      return;
    }
    navigate("/create-quotation/rooms");
  };

  const handleSkip = () => {
    saveQuotationData({ selectedPackage: null, resumeCart: false });
    navigate("/create-quotation/rooms");
    toast({ title: "Skipped", description: "Package selection skipped" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Packages Available</h3>
        <p className="text-muted-foreground mb-4">No packages have been created yet.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={() => navigate("/packages")} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Package
          </Button>
          <Button variant="outline" onClick={handleSkip} className="gap-2">
            <SkipForward className="w-4 h-4" />
            Skip to Rooms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-semibold text-foreground mb-2">Select Package</h2>
        <p className="text-muted-foreground">Choose a package that best suits your client's needs</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const Icon = packageIcons[pkg.icon as keyof typeof packageIcons] || Home;
          const isSelected = selectedPackage?.package_id === pkg.package_id;

          // Parse room count from rooms field
          const roomCount = pkg.rooms ? pkg.rooms.split(',').filter(r => r.trim()).length : 0;

          return (
            <Card
              key={pkg.package_id}
              onClick={() => handleSelectPackage(pkg)}
              className={cn(
                "relative p-6 cursor-pointer transition-all duration-300 overflow-hidden group",
                isSelected
                  ? "border-primary border-2 shadow-elevated"
                  : "border-border hover:border-muted-foreground/30 hover:shadow-soft"
              )}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110">
                <Icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                {pkg.package_name}
              </h3>
              {pkg.details && (
                <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                  {pkg.details}
                </p>
              )}
             
              <p className="text-xs text-muted-foreground">
                {roomCount} room{roomCount !== 1 ? 's' : ''} included
              </p>
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Navigation */}
    
    </div>
  );
}
