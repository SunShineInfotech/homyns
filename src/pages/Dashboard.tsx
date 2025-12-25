import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  FileText,
  Users,
  IndianRupee,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const stats = [
  {
    label: "Total Quotations",
    value: "127",
    change: "+12%",
    icon: FileText,
    color: "primary",
  },
  {
    label: "Active Clients",
    value: "48",
    change: "+5%",
    icon: Users,
    color: "accent",
  },
  {
    label: "Revenue This Month",
    value: "₹24.5L",
    change: "+18%",
    icon: IndianRupee,
    color: "success",
  },
  {
    label: "Conversion Rate",
    value: "68%",
    change: "+3%",
    icon: TrendingUp,
    color: "primary",
  },
];

const recentQuotations = [
  {
    id: "Q-2024-001",
    client: "Priya Sharma",
    package: "Luxury",
    amount: "₹8,50,000",
    status: "Approved",
    date: "Dec 24, 2024",
  },
  {
    id: "Q-2024-002",
    client: "Rahul Mehta",
    package: "Regular",
    amount: "₹4,20,000",
    status: "Pending",
    date: "Dec 23, 2024",
  },
  {
    id: "Q-2024-003",
    client: "Ananya Patel",
    package: "Basic",
    amount: "₹1,80,000",
    status: "Approved",
    date: "Dec 22, 2024",
  },
  {
    id: "Q-2024-004",
    client: "Vikram Singh",
    package: "Luxury",
    amount: "₹12,00,000",
    status: "Draft",
    date: "Dec 21, 2024",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Approved":
      return "bg-success/10 text-success";
    case "Pending":
      return "bg-warning/10 text-warning";
    case "Draft":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <MainLayout title="Dashboard" subtitle="Welcome back, Arjun">
      <div className="space-y-8 animate-fade-in">
        {/* Quick Action */}
        <Card className="bg-gradient-to-br from-primary to-primary/90 border-0 p-6 shadow-elevated">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-semibold text-primary-foreground mb-2">
                Create New Quotation
              </h2>
              <p className="text-primary-foreground/80">
                Start crafting a professional quotation for your clients
              </p>
            </div>
            <Button
              onClick={() => navigate("/create-quotation")}
              className="bg-card text-foreground hover:bg-card/90 shadow-lg gap-2"
              size="lg"
            >
              <Plus className="w-5 h-5" />
              New Quotation
            </Button>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="p-5 bg-card border-border hover:shadow-elevated transition-shadow duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    stat.color === "primary"
                      ? "bg-primary/10"
                      : stat.color === "accent"
                      ? "bg-accent/10"
                      : "bg-success/10"
                  }`}
                >
                  <stat.icon
                    className={`w-5 h-5 ${
                      stat.color === "primary"
                        ? "text-primary"
                        : stat.color === "accent"
                        ? "text-accent"
                        : "text-success"
                    }`}
                  />
                </div>
                <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-semibold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Recent Quotations */}
        <Card className="border-border bg-card shadow-soft overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground">
                Recent Quotations
              </h3>
              <p className="text-sm text-muted-foreground">
                Your latest quotation activities
              </p>
            </div>
            <Button variant="ghost" className="text-primary gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Quotation ID
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Client
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Package
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Amount
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentQuotations.map((q) => (
                  <tr
                    key={q.id}
                    className="hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-foreground">{q.id}</span>
                    </td>
                    <td className="px-6 py-4 text-foreground">{q.client}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {q.package}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {q.amount}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          q.status
                        )}`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{q.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
