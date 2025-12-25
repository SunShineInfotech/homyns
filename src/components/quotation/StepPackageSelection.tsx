import { Card } from "@/components/ui/card";
import { Package as PackageType } from "@/data/quotationData";
import { cn } from "@/lib/utils";
import { Home, Building, Crown, Check } from "lucide-react";

interface StepPackageSelectionProps {
  packages: PackageType[];
  selectedPackage: PackageType | null;
  onSelectPackage: (pkg: PackageType) => void;
}

const packageIcons: Record<string, React.ElementType> = {
  home: Home,
  building: Building,
  crown: Crown,
};

const packageColors: Record<string, { bg: string; border: string; icon: string }> = {
  basic: {
    bg: "bg-secondary",
    border: "border-primary",
    icon: "text-primary",
  },
  regular: {
    bg: "bg-primary/5",
    border: "border-primary",
    icon: "text-primary",
  },
  luxury: {
    bg: "bg-gold/5",
    border: "border-gold",
    icon: "text-gold",
  },
};

export function StepPackageSelection({
  packages,
  selectedPackage,
  onSelectPackage,
}: StepPackageSelectionProps) {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
          Select Package
        </h2>
        <p className="text-muted-foreground">
          Choose a package that best suits your client's needs
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const Icon = packageIcons[pkg.icon] || Home;
          const colors = packageColors[pkg.id] || packageColors.basic;
          const isSelected = selectedPackage?.id === pkg.id;

          return (
            <Card
              key={pkg.id}
              onClick={() => onSelectPackage(pkg)}
              className={cn(
                "relative p-6 cursor-pointer transition-all duration-300 overflow-hidden group",
                isSelected
                  ? `${colors.border} border-2 shadow-elevated`
                  : "border-border hover:border-muted-foreground/30 hover:shadow-soft"
              )}
            >
              {/* Popular Badge for Luxury */}
              {pkg.id === "luxury" && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-gold/20 text-gold">
                  Popular
                </div>
              )}

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}

              <div
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110",
                  pkg.id === "luxury" ? "bg-gold/10" : "bg-primary/10"
                )}
              >
                <Icon
                  className={cn(
                    "w-8 h-8",
                    pkg.id === "luxury" ? "text-gold" : "text-primary"
                  )}
                />
              </div>

              <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                {pkg.name}
              </h3>

              <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                {pkg.description}
              </p>

              <div className="mb-5">
                <span className="text-sm text-muted-foreground">Starting at</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-foreground">
                    ₹{(pkg.startingPrice / 100000).toFixed(1)}L
                  </span>
                </div>
              </div>

              <ul className="space-y-2.5">
                {pkg.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                        pkg.id === "luxury" ? "bg-gold/10" : "bg-primary/10"
                      )}
                    >
                      <Check
                        className={cn(
                          "w-3 h-3",
                          pkg.id === "luxury" ? "text-gold" : "text-primary"
                        )}
                      />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}