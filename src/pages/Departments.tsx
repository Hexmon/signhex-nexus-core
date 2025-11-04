import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { DepartmentCard } from "@/components/departments/DepartmentCard";
import { DepartmentFormDialog } from "@/components/departments/DepartmentFormDialog";
import { TransferScreensDialog } from "@/components/departments/TransferScreensDialog";
import { DeleteDepartmentDialog } from "@/components/departments/DeleteDepartmentDialog";

interface Department {
  id: string;
  name: string;
  description: string;
  screenCount: number;
  owners: string[];
  operators: string[];
  storageUsed: string;
  storageQuota: string;
}

const mockDepartments: Department[] = [
  {
    id: "dept-1",
    name: "Marketing",
    description: "Marketing and promotional content",
    screenCount: 24,
    owners: ["John Smith", "Sarah Connor"],
    operators: ["Mike Johnson", "Emily Davis"],
    storageUsed: "45.2 GB",
    storageQuota: "100 GB",
  },
  {
    id: "dept-2",
    name: "HR & Internal Comms",
    description: "Employee communications and announcements",
    screenCount: 12,
    owners: ["David Lee"],
    operators: ["Anna White", "Tom Brown"],
    storageUsed: "12.8 GB",
    storageQuota: "50 GB",
  },
  {
    id: "dept-3",
    name: "Operations",
    description: "Operational updates and KPIs",
    screenCount: 18,
    owners: ["Rachel Green"],
    operators: ["Chris Evans"],
    storageUsed: "28.5 GB",
    storageQuota: "75 GB",
  },
  {
    id: "dept-4",
    name: "Sales",
    description: "Sales performance and targets",
    screenCount: 16,
    owners: ["Michael Scott"],
    operators: ["Jim Halpert", "Pam Beesly"],
    storageUsed: "34.1 GB",
    storageQuota: "100 GB",
  },
];

const Departments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [departments] = useState<Department[]>(mockDepartments);
  const [formOpen, setFormOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (dept: Department) => {
    setSelectedDepartment(dept);
    setFormOpen(true);
  };

  const handleTransfer = (dept: Department) => {
    setSelectedDepartment(dept);
    setTransferOpen(true);
  };

  const handleDelete = (dept: Department) => {
    setSelectedDepartment(dept);
    setDeleteOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedDepartment(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Department Management</h1>
          <p className="text-muted-foreground mt-1">
            Organize screens, users, and content by department
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Department
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredDepartments.length} {filteredDepartments.length === 1 ? "department" : "departments"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((dept) => (
          <DepartmentCard
            key={dept.id}
            department={dept}
            onEdit={handleEdit}
            onTransfer={handleTransfer}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No departments found</p>
        </div>
      )}

      <DepartmentFormDialog
        open={formOpen}
        onClose={handleCloseForm}
        department={selectedDepartment}
      />

      <TransferScreensDialog
        open={transferOpen}
        onClose={() => {
          setTransferOpen(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
      />

      <DeleteDepartmentDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
      />
    </div>
  );
};

export default Departments;
