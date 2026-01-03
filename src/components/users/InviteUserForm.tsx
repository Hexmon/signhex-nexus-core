import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import { departmentsApi } from "@/api/domains/departments";
import type { Role } from "@/api/types";
import type { InviteFormData } from "@/types/user";

interface InviteUserFormProps {
    onSubmit: (data: InviteFormData) => void;
    onCancel: () => void;
    isLoading: boolean;
}

export function InviteUserForm({ onSubmit, onCancel, isLoading }: InviteUserFormProps) {
    const [formData, setFormData] = useState<InviteFormData>({
        email: "",
        role: "OPERATOR",
        department_id: "",
    });

    const { data: departmentsData, isLoading: isDepartmentsLoading } = useQuery({
        queryKey: ["departments"],
        queryFn: () => departmentsApi.list({ page: 1, limit: 100 }),
    });

    const departments = departmentsData?.items || [];

    const handleSubmit = () => {
        onSubmit(formData);
    };

    const updateField = (field: keyof InviteFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const isValid = formData.email.trim();

    return (
        <div className="space-y-4 py-2">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                    An invitation email will be sent to the user with instructions to activate their account.
                </AlertDescription>
            </Alert>

            <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                    id="invite-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="user@example.com"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                    value={formData.role}
                    onValueChange={(value: Role) => updateField("role", value)}
                >
                    <SelectTrigger id="invite-role">
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="OPERATOR">Operator</SelectItem>
                        <SelectItem value="DEPARTMENT">Department</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="invite-department">Department (Optional)</Label>
                {isDepartmentsLoading ? (
                    <div className="flex items-center gap-2 p-2 border rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Loading departments...</span>
                    </div>
                ) : departments.length === 0 ? (
                    <div className="p-2 border rounded-md text-sm text-muted-foreground">
                        No departments available
                    </div>
                ) : (
                    <Select
                        value={formData.department_id || "none"}
                        onValueChange={(value: string) => updateField("department_id", value === "none" ? "" : value)}
                    >
                        <SelectTrigger id="invite-department">
                            <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                    {dept.description && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                            - {dept.description}
                                        </span>
                                    )}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading || !isValid}>
                    {isLoading ? "Sending..." : "Send Invitation"}
                </Button>
            </DialogFooter>
        </div>
    );
}