import { MainLayout } from "@/components/layout/MainLayout";
import { CrudShell, newId } from "@/components/crud/CrudShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roomsMaster, RoomMaster } from "@/data/mockData";

export default function Rooms() {
  return (
    <MainLayout title="Rooms" subtitle="Room types used across packages">
      <CrudShell<RoomMaster>
        entityName="Room"
        initialData={roomsMaster}
        exportFileName="rooms.csv"
        searchKeys={["name"]}
        emptyRow={() => ({ id: newId(), name: "" })}
        columns={[{ key: "name", header: "Room Name", sortable: true }]}
        renderMobileCard={(r) => <p className="font-semibold">{r.name}</p>}
        validate={(r) => !r.name.trim() ? "Name required" : null}
        renderForm={(row, setRow) => (
          <div><Label>Room Name</Label><Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} className="h-11 rounded-xl mt-1.5" placeholder="e.g. Bedroom" /></div>
        )}
      />
    </MainLayout>
  );
}
