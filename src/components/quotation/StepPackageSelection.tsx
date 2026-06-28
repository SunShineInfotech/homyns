// src/components/quotation/StepPackageSelection.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package as PackageType } from "@/services/package.service";
import { cn } from "@/lib/utils";
import { Home, Building, Crown, Check, Loader2, SkipForward } from "lucide-react";

interface StepPackageSelectionProps {
  packages: PackageType[];
  selectedPackage: PackageType | null;
  onSelectPackage: (pkg: PackageType) => void;
  loading?: boolean;
  onSkip?: () => void;
}

const packageIcons: Record<string, React.ElementType> = {
  home: Home,
  building: Building,
  crown: Crown,
};

export function StepPackageSelection({
  packages,
  selectedPackage,
  onSelectPackage,
  loading = false,
  onSkip,
}: StepPackageSelectionProps) {
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
        <p className="text-muted-foreground mb-4">No packages have been created yet. You can skip this step and add items directly.</p>
        {onSkip && <Button onClick={onSkip} className="gap-2"><SkipForward className="w-4 h-4" /> Skip to Items</Button>}
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-semibold text-foreground mb-2">Select Package</h2>
        <p className="text-muted-foreground">Choose a package that best suits your client's needs</p>
        {onSkip && (
          <Button variant="ghost" size="sm" onClick={onSkip} className="mt-2 gap-1">
            <SkipForward className="w-3 h-3" /> Skip this step
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const Icon = packageIcons[pkg.icon as keyof typeof packageIcons] || Home;
          const isSelected = selectedPackage?.package_id === pkg.package_id;

          return (
            <Card
              key={pkg.package_id}
              onClick={() => onSelectPackage(pkg)}
              className={cn(
                "relative p-6 cursor-pointer transition-all duration-300 overflow-hidden group",
                isSelected ? "border-primary border-2 shadow-elevated" : "border-border hover:border-muted-foreground/30 hover:shadow-soft"
              )}
            >
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110", "bg-primary/10")}>
                <Icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">{pkg.package_name}</h3>
              {pkg.details && <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">{pkg.details}</p>}
              <div className="mb-5">
                <span className="text-sm text-muted-foreground">Completion</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-foreground">{pkg.completion_days || 0} days</span>
                </div>
              </div>
              <ul className="space-y-2.5">
                {pkg.rooms && (
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-foreground">{pkg.rooms.split(',').filter(r => r.trim()).length} rooms included</span>
                  </li>
                )}
              </ul>
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}