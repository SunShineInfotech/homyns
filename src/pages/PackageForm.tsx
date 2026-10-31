// src/pages/Masters/PackageForm.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/hooks/use-toast";
import { packageService, Package } from "@/services/package.service";
import { roomService, Room } from "@/services/room.service";
import { ArrowLeft, Save, Loader2, Plus, X, CheckCircle2, AlertCircle } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

interface RoomOption {
  room_id: string;
  room_name: string;
}

export default function PackageForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const isViewMode = window.location.pathname.includes("/view/");

  const nameInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Package>>({
    package_name: "",
    details: "",
    completion_days: 0,
    rooms: "",
    status: "Active",
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  // Selected rooms for display
  const [selectedRooms, setSelectedRooms] = useState<RoomOption[]>([]);
  const [newRoomId, setNewRoomId] = useState("");
  const [roomError, setRoomError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "";

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      return "";
    }
  };

  const getEmployeeId = (): string => {
    try {
      const raw = localStorage.getItem("user_data");
      if (raw) {
        const userData = JSON.parse(raw);
        return userData?.emp_id || "";
      }
      return "";
    } catch {
      return "";
    }
  };

  // Fetch master data
  useEffect(() => {
    const fetchMasters = async () => {
      setLoadingMasters(true);
      try {
        const companyId = getCompanyId();
        if (!companyId) {
          toast({ title: "Error", description: "Company not found", variant: "destructive" });
          return;
        }

        const roomsRes = await roomService.getRooms(companyId);

        if (roomsRes.status === "success" && roomsRes.data) {
          setRooms(roomsRes.data);
        }
      } catch (e: any) {
        toast({ title: "Error", description: "Failed to load rooms", variant: "destructive" });
      } finally {
        setLoadingMasters(false);
      }
    };
    fetchMasters();
  }, []);

  // Fetch package data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchPackage = async () => {
        setLoading(true);
        try {
          const companyId = getCompanyId();
          if (!companyId) {
            toast({ title: "Error", description: "Company not found", variant: "destructive" });
            navigate("/packages");
            return;
          }

          const response = await packageService.getPackages(companyId);
          if (response.status === "success" && response.data) {
            const pkg = response.data.find((p) => p.package_id === id);
            if (pkg) {
              setFormData({
                package_id: pkg.package_id,
                package_name: pkg.package_name,
                details: pkg.details || "",
                completion_days: pkg.completion_days || 0,
                rooms: pkg.rooms || "",
                status: pkg.status || "Active",
              });

              // Parse selected rooms
              if (pkg.rooms) {
                const roomIds = pkg.rooms.split(',').filter(r => r.trim());
                const selected = roomIds
                  .map((roomId) => {
                    const room = rooms.find((r) => r.room_id === roomId.trim());
                    if (room) {
                      return { room_id: room.room_id!, room_name: room.room_name };
                    }
                    return null;
                  })
                  .filter((r) => r !== null) as RoomOption[];
                setSelectedRooms(selected);
              }
            } else {
              toast({ title: "Error", description: "Package not found", variant: "destructive" });
              navigate("/packages");
            }
          }
        } catch (e: any) {
          toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
          navigate("/packages");
        } finally {
          setLoading(false);
        }
      };
      fetchPackage();
    }
  }, [id, isEditMode, navigate, rooms]);

  useEffect(() => {
    if (!loading && !loadingMasters && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [loading, loadingMasters]);

  // Room helpers
  const roomOptions = rooms.map((r) => ({
    value: r.room_id || "",
    label: r.room_name,
  }));

  const isRoomAlreadyAdded = !!newRoomId && selectedRooms.some((r) => r.room_id === newRoomId);
  const isAddRoomDisabled = !newRoomId || isRoomAlreadyAdded;
  // Check if a room is selected but not added
  const hasUnaddedSelection = !!newRoomId && !isRoomAlreadyAdded;

  const handleAddRoom = () => {
    if (!newRoomId) {
      setRoomError("Please select a room");
      return;
    }
    if (isRoomAlreadyAdded) {
      setRoomError("This room is already added");
      return;
    }

    const room = rooms.find((r) => r.room_id === newRoomId);
    if (room) {
      setSelectedRooms([...selectedRooms, { room_id: room.room_id!, room_name: room.room_name }]);
      setNewRoomId("");
      setRoomError("");
    }
  };

  const handleRemoveRoom = (index: number) => {
    setSelectedRooms(selectedRooms.filter((_, i) => i !== index));
  };

  const handleClearRooms = () => {
    setSelectedRooms([]);
    setNewRoomId("");
    setRoomError("");
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if there's an unadded room selection
    if (hasUnaddedSelection) {
      setFormError("Please add the selected room to the list before saving.");
      return;
    }

    if (!formData.package_name?.trim()) {
      setFormError("Package name is required.");
      nameInputRef.current?.focus();
      return;
    }

    // if (!formData.completion_days || formData.completion_days <= 0) {
    //   setFormError("Completion days must be greater than 0.");
    //   return;
    // }

    setFormError("");
    setSaving(true);

    try {
      // Prepare rooms as comma-separated string
      const roomsString = selectedRooms.map((r) => r.room_id).join(',');

      if (isEditMode && formData.package_id) {
        // UPDATE - no need to send created_by
        const payload = {
          package_id: formData.package_id,
          package_name: formData.package_name!.trim(),
          details: formData.details?.trim() || "",
          completion_days: Number(formData.completion_days) || 0,
          rooms: roomsString,
          status: formData.status || "Active",
        };

        const res = await packageService.updatePackage(payload);
        if (res.status === "success") {
          toast({ title: "Success", description: "Package updated successfully" });
          navigate("/packages");
        } else {
          toast({ title: "Error", description: res.message || "Operation failed", variant: "destructive" });
        }
      } else {
        // ADD - send created_by
        const employeeId = getEmployeeId();
        if (!employeeId) {
          setFormError("Employee ID not found. Please login again.");
          setSaving(false);
          return;
        }

        const payload = {
          company_id: getCompanyId(),
          package_name: formData.package_name!.trim(),
          details: formData.details?.trim() || "",
          completion_days: Number(formData.completion_days) || 0,
          rooms: roomsString,
          created_by: employeeId,
          status: formData.status || "Active",
        };

        const res = await packageService.addPackage(payload);
        if (res.status === "success") {
          toast({ title: "Success", description: "Package added successfully" });
          navigate("/packages");
        } else {
          toast({ title: "Error", description: res.message || "Operation failed", variant: "destructive" });
        }
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => navigate("/packages");

  const title = isViewMode ? "View Package" : isEditMode ? "Edit Package" : "Add Package";
  const subtitle = isViewMode ? "View package details" : isEditMode ? "Update package information" : "Add new package";

  if (loading || loadingMasters) {
    return (
      <MainLayout title={title} subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={title} subtitle={subtitle}>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
       

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-card rounded-2xl border p-5 md:p-6 space-y-4">
            <h3 className="text-base font-semibold text-foreground border-b pb-3">Package Information</h3>

            <div>
              <Label htmlFor="package_name">
                Package Name <span className="text-destructive">*</span>
              </Label>
              <Input
                ref={nameInputRef}
                id="package_name"
                value={formData.package_name || ""}
                onChange={(e) => { setFormData((p) => ({ ...p, package_name: e.target.value })); if (formError) setFormError(""); }}
                className="h-11 rounded-xl mt-1.5"
                placeholder="e.g. Premium Interior Package"
                disabled={isViewMode}
                required
              />
            </div>

            <div>
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                value={formData.details || ""}
                onChange={(e) => setFormData((p) => ({ ...p, details: e.target.value }))}
                className="min-h-[100px] rounded-xl mt-1.5 resize-y"
                placeholder="Package details and description..."
                disabled={isViewMode}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" >
              <div style={{display:'none'}}>
                <Label htmlFor="completion_days">
                  Completion Days <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="completion_days"
                  type="number"
                  value={formData.completion_days || 0}
                  // onChange={(e) => setFormData((p) => ({ ...p, completion_days: parseInt(e.target.value) || 0 }))}
                  // className="h-11 rounded-xl mt-1.5"
                  // min="1"
                  // placeholder="e.g. 30"
                  // disabled={isViewMode}
                  disabled
                  
                />
                <p className="text-xs text-muted-foreground mt-1">Estimated number of days to complete the project</p>
              </div>

              <div>
                <Label>Status</Label>
                <div className="mt-1.5">
                  <SearchableSelect
                    options={STATUS_OPTIONS}
                    value={formData.status || "Active"}
                    onChange={(v) => setFormData((p) => ({ ...p, status: v }))}
                    placeholder="Select status..."
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rooms Section */}
          <div className="bg-card rounded-2xl border p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <h3 className="text-base font-semibold">Rooms Included</h3>
              {selectedRooms.length > 0 && (
                <Badge variant="secondary" className="rounded-full text-xs">{selectedRooms.length}</Badge>
              )}
            </div>

            {!isViewMode && (
              <div className="p-4 bg-muted/20 rounded-xl border border-dashed space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Room</p>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-10 space-y-1">
                    <Label className="text-xs">Select Room</Label>
                    <SearchableSelect
                      options={roomOptions}
                      value={newRoomId}
                      onChange={(v) => {
                        setNewRoomId(v);
                        setRoomError("");
                      }}
                      placeholder="Search and select room..."
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddRoom}
                      disabled={isAddRoomDisabled}
                      className="w-full rounded-xl gap-1.5 h-10"
                    >
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>

                {isRoomAlreadyAdded && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> This room is already added
                  </div>
                )}
                {roomError && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {roomError}
                  </div>
                )}
                
                {/* Warning for unadded selection */}
                {hasUnaddedSelection && (
                  <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>
                      You have a room selected but not added.
                      Please click <strong>Add</strong> to include it, or clear the selection before saving.
                    </span>
                  </div>
                )}
              </div>
            )}

            {selectedRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <p className="text-sm text-muted-foreground">No rooms added to this package</p>
                <p className="text-xs text-muted-foreground/60">Select rooms above to include in this package</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {selectedRooms.map((room, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="rounded-lg px-3 py-1.5 text-sm gap-1.5 flex items-center"
                    >
                      {room.room_name}
                      {!isViewMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRoom(index)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>

                {!isViewMode && selectedRooms.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      {selectedRooms.length} room{selectedRooms.length !== 1 ? "s" : ""} selected
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="rounded-xl gap-1"
                      onClick={handleClearRooms}
                    >
                      <X className="h-3.5 w-3.5" /> Clear All
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
            </div>
          )}

          {!isViewMode ? (
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-11 px-6 flex-1 sm:flex-none"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl h-11 px-6 gap-2 flex-1 sm:flex-none"
                disabled={saving || hasUnaddedSelection}
                title={hasUnaddedSelection ? "Add or clear the selected room before saving" : undefined}
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                ) : (
                  <><Save className="h-4 w-4" /> {isEditMode ? "Update Package" : "Add Package"}</>
                )}
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" className="rounded-xl h-11 px-6 gap-2" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4" /> Back to List
            </Button>
          )}
        </form>
      </div>
    </MainLayout>
  );
}