import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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

interface DepartmentFormDialogProps {
  open: boolean;
  onClose: () => void;
  department?: Department | null;
}

export const DepartmentFormDialog = ({ open, onClose, department }: DepartmentFormDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    storageQuota: "50",
    owners: "",
    operators: "",
  });

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        description: department.description,
        storageQuota: department.storageQuota.replace(" GB", ""),
        owners: department.owners.join(", "),
        operators: department.operators.join(", "),
      });
    } else {
      setFormData({
        name: "",
        description: "",
        storageQuota: "50",
        owners: "",
        operators: "",
      });
    }
  }, [department, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: department ? "Department updated" : "Department created",
      description: `${formData.name} has been ${department ? "updated" : "created"} successfully.`,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{department ? "Edit Department" : "Create New Department"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Department Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Marketing"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this department's purpose"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storageQuota">Storage Quota (GB) *</Label>
            <Input
              id="storageQuota"
              type="number"
              value={formData.storageQuota}
              onChange={(e) => setFormData({ ...formData, storageQuota: e.target.value })}
              placeholder="50"
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owners">Owners (comma-separated emails or names)</Label>
            <Input
              id="owners"
              value={formData.owners}
              onChange={(e) => setFormData({ ...formData, owners: e.target.value })}
              placeholder="john@example.com, sarah@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="operators">Operators (comma-separated emails or names)</Label>
            <Input
              id="operators"
              value={formData.operators}
              onChange={(e) => setFormData({ ...formData, operators: e.target.value })}
              placeholder="mike@example.com, emily@example.com"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{department ? "Update" : "Create"} Department</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
