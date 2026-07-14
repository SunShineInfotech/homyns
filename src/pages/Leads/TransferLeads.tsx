// src/pages/Leads/TransferLeads.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { leadService, Lead } from "@/services/lead.service";
import { followupService, Followup } from "@/services/followup.service";
import { employeeService, Employee } from "@/services/employee.service";
import {
    Loader2,
    Users,
    UserPlus,
    ArrowRight,
    Phone,
    Mail,
    Calendar,
    Clock,
    MessageSquare,
    Search,
    X,
} from "lucide-react";

type TransferType = 'leads' | 'followups';

export default function TransferLeads() {
    const navigate = useNavigate();
    const [transferType, setTransferType] = useState<TransferType>('leads');
    const [items, setItems] = useState<(Lead | Followup)[]>([]);
    const [filtered, setFiltered] = useState<(Lead | Followup)[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [transferring, setTransferring] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [targetEmployeeId, setTargetEmployeeId] = useState<string>("");

    const getCompanyId = (): string => {
        try {
            const raw = localStorage.getItem("company_data");
            if (raw) return JSON.parse(raw)?.company_id || "";
        } catch { return ""; }
        return "";
    };

    const getEmployeeId = (): string => {
        try {
            const raw = localStorage.getItem("user_data");
            if (raw) return JSON.parse(raw)?.emp_id || "";
        } catch { return ""; }
        return "";
    };

    const fetchEmployees = useCallback(async () => {
        try {
            const companyId = getCompanyId();
            if (!companyId) return;
            const res = await employeeService.getEmployees(companyId);
            if (res.status === "success" && res.data) {
                setEmployees(res.data.filter(e => e.emp_id !== getEmployeeId()));
            }
        } catch (e) {
            console.error("Failed to fetch employees:", e);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const companyId = getCompanyId();
            if (!companyId) {
                toast({ title: "Error", description: "Company not found", variant: "destructive" });
                return;
            }

            let data: any[] = [];
            if (transferType === 'leads') {
                const res = await leadService.getLeads(companyId, 'all');
                if (res.status === "success" && res.data) {
                    data = res.data;
                }
            } else {
                const res = await followupService.getFollowups(companyId, 'all');
                if (res.status === "success" && res.data) {
                    data = res.data;
                }
            }
            setItems(data);
            setSelectedIds([]);
        } catch (e: any) {
            toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [transferType]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    useEffect(() => {
        let list = [...items];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((item) => {
                if (transferType === 'leads') {
                    const lead = item as Lead;
                    return lead.lead_name?.toLowerCase().includes(q) ||
                        lead.phone1?.includes(q) ||
                        lead.email?.toLowerCase().includes(q) ||
                        lead.project_name?.toLowerCase().includes(q);
                } else {
                    const followup = item as Followup;
                    return followup.lead_name?.toLowerCase().includes(q) ||
                        followup.remark?.toLowerCase().includes(q) ||
                        followup.followup_by_name?.toLowerCase().includes(q);
                }
            });
        }
        setFiltered(list);
    }, [items, search, transferType]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filtered.map(item => item.lead_id || item.followup_id || "").filter(id => id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectItem = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(i => i !== id));
        }
    };

    const handleTransfer = async () => {
        if (selectedIds.length === 0) {
            toast({ title: "Error", description: "Please select at least one item to transfer", variant: "destructive" });
            return;
        }
        if (!targetEmployeeId) {
            toast({ title: "Error", description: "Please select a target employee", variant: "destructive" });
            return;
        }

        setTransferring(true);
        try {
            let res;
            if (transferType === 'leads') {
                res = await leadService.transferLeads(selectedIds, targetEmployeeId);
            } else {
                res = await followupService.transferFollowups(selectedIds, targetEmployeeId);
            }

            if (res.status === "success") {
                toast({
                    title: "Success",
                    description: `${selectedIds.length} ${transferType} transferred successfully`
                });
                setSelectedIds([]);
                await fetchItems();
            } else {
                toast({ title: "Error", description: res.message || "Transfer failed", variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
        } finally {
            setTransferring(false);
        }
    };

    const getItemDisplay = (item: Lead | Followup) => {
        if (transferType === 'leads') {
            const lead = item as Lead;
            return {
                id: lead.lead_id || "",
                title: lead.lead_name || "",
                subtitle: lead.phone1 || "",
                detail: lead.project_name || "",
                assigned: lead.assigned_emp_name || "Unassigned",
                date: lead.c_date || "",
            };
        } else {
            const followup = item as Followup;
            return {
                id: followup.followup_id || "",
                title: followup.lead_name || "",
                subtitle: followup.remark || "",
                detail: followup.mode || "",
                assigned: followup.followup_by_name || "Unknown",
                date: followup.followup_date || "",
            };
        }
    };

    if (loading) {
        return (
            <MainLayout title="Transfer" subtitle="Transfer leads and followups">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Transfer" subtitle="Transfer leads and followups to other employees">
            <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="flex gap-2">
                        <Button
                            variant={transferType === 'leads' ? 'default' : 'outline'}
                            className="rounded-xl"
                            onClick={() => setTransferType('leads')}
                        >
                            <Users className="h-4 w-4 mr-2" /> Leads
                        </Button>
                        <Button
                            variant={transferType === 'followups' ? 'default' : 'outline'}
                            className="rounded-xl"
                            onClick={() => setTransferType('followups')}
                        >
                            <MessageSquare className="h-4 w-4 mr-2" /> Followups
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="pl-9 h-10 rounded-xl w-48"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            )}
                        </div>
                        <Badge variant="secondary" className="rounded-lg px-3 py-1.5">
                            {selectedIds.length} selected
                        </Badge>
                    </div>
                </div>

                {/* Transfer controls */}
                <Card className="p-4 rounded-2xl bg-muted/30">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <Label>Transfer to Employee</Label>
                            <Select value={targetEmployeeId} onValueChange={setTargetEmployeeId}>
                                <SelectTrigger className="h-10 rounded-xl mt-1">
                                    <SelectValue placeholder="Select employee..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.emp_id} value={emp.emp_id || ""}>
                                            {emp.name || emp.emp_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleTransfer}
                            disabled={transferring || selectedIds.length === 0 || !targetEmployeeId}
                            className="rounded-xl gap-2 h-10"
                        >
                            {transferring ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Transferring...</>
                            ) : (
                                <><ArrowRight className="h-4 w-4" /> Transfer {selectedIds.length} {transferType}</>
                            )}
                        </Button>
                    </div>
                </Card>

                {/* Items list */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                            <UserPlus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-muted-foreground">
                            {search ? "No items match your search" : `No ${transferType} to transfer`}
                        </p>
                    </div>
                ) : (
                    <Card className="rounded-2xl overflow-hidden">
                        <div className="p-3 bg-muted/30 border-b flex items-center gap-2">
                            <Checkbox
                                checked={selectedIds.length === filtered.length && filtered.length > 0}
                                onCheckedChange={handleSelectAll}
                            />
                            <span className="text-sm font-medium">Select All</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                                {filtered.length} {transferType}
                            </span>
                        </div>
                        <div className="divide-y max-h-[500px] overflow-y-auto">
                            {filtered.map((item) => {
                                const display = getItemDisplay(item);
                                return (
                                    <div key={display.id} className="p-3 hover:bg-muted/30 transition-colors flex items-center gap-3">
                                        <Checkbox
                                            checked={selectedIds.includes(display.id)}
                                            onCheckedChange={(checked) => handleSelectItem(display.id, !!checked)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{display.title}</p>
                                            {display.subtitle && (
                                                <p className="text-xs text-muted-foreground truncate">{display.subtitle}</p>
                                            )}
                                            {display.detail && (
                                                <p className="text-xs text-muted-foreground truncate">{display.detail}</p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-muted-foreground">{display.assigned}</p>
                                            {display.date && (
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(display.date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
}