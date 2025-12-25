import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Check,
} from "lucide-react";
import { Client } from "@/data/quotationData";
import { cn } from "@/lib/utils";

interface StepClientSelectionProps {
  clients: Client[];
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
}

export function StepClientSelection({
  clients,
  selectedClient,
  onSelectClient,
}: StepClientSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery)
  );

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Client Selection */}
      <div className="lg:col-span-2">
        <Card className="p-6 bg-card border-border shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-display font-semibold text-foreground">
                Select Client
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose an existing client or add a new one
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-0"
            />
          </div>

          {/* Client List */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => onSelectClient(client)}
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                  selectedClient?.id === client.id
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-transparent bg-secondary/50 hover:bg-secondary hover:border-border"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold",
                        selectedClient?.id === client.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {client.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {client.email}
                      </p>
                    </div>
                  </div>
                  {selectedClient?.id === client.id && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Client Details */}
      <div className="lg:col-span-1">
        <Card className="p-6 bg-card border-border shadow-soft sticky top-24">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">
            Client Details
          </h3>

          {selectedClient ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">
                    {selectedClient.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">
                    {selectedClient.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">
                    {selectedClient.email}
                  </p>
                </div>
              </div>

              {selectedClient.address && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium text-foreground">
                      {selectedClient.address}
                    </p>
                  </div>
                </div>
              )}

              {selectedClient.company && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <Building className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="font-medium text-foreground">
                      {selectedClient.company}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Select a client to view details
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
