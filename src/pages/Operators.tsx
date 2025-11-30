import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Shield, User, MoreVertical, Edit, Trash2, RefreshCw, CheckCircle, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usersApi } from "@/api/domains/users";
import { Skeleton } from "@/components/ui/skeleton";
import type { User as ApiUser } from "@/api/types";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/api/apiClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { queryKeys } from "@/api/queryKeys";
import { useSafeMutation } from "@/hooks/useSafeMutation";

const roleColor: Record<string, string> = {
  ADMIN: "bg-purple-500/10 text-purple-700",
  OPERATOR: "bg-blue-500/10 text-blue-700",
  DEPARTMENT: "bg-emerald-500/10 text-emerald-700",
};

export default function Operators() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "OPERATOR",
    department_id: "",
  });
  const [pendingActionUser, setPendingActionUser] = useState<ApiUser | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isActivateConfirmOpen, setIsActivateConfirmOpen] = useState(false);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: queryKeys.users,
    queryFn: () => usersApi.list({ page: 1, limit: 100 }),
  });

  useEffect(() => {
    if (isError) {
      const message = error instanceof ApiError ? error.message : "Unable to load operators.";
      toast({ title: "Load failed", description: message, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const users = useMemo(() => data?.items ?? [], [data]);

  const filtered = useMemo(
    () =>
      users.filter((user) => {
        const q = searchQuery.toLowerCase();
        return (
          q === "" ||
          user.email.toLowerCase().includes(q) ||
          (user.first_name || "").toLowerCase().includes(q) ||
          (user.last_name || "").toLowerCase().includes(q)
        );
      }),
    [users, searchQuery]
  );

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        email: selectedUser.email,
        first_name: selectedUser.first_name ?? "",
        last_name: selectedUser.last_name ?? "",
        role: selectedUser.role,
        department_id: selectedUser.department_id ?? "",
      });
    } else {
      setFormData({
        email: "",
        first_name: "",
        last_name: "",
        role: "OPERATOR",
        department_id: "",
      });
    }
  }, [selectedUser, isFormOpen]);

  const createOrUpdate = useSafeMutation({
    mutationFn: async () => {
      const payload = {
        email: formData.email.trim(),
        first_name: formData.first_name.trim() || undefined,
        last_name: formData.last_name.trim() || undefined,
        role: formData.role as ApiUser["role"],
        department_id: formData.department_id.trim() || undefined,
      };
      if (selectedUser) {
        return usersApi.update(selectedUser.id, payload);
      }
      return usersApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      setIsFormOpen(false);
      setSelectedUser(null);
    },
  }, "Unable to save operator.");

  const deleteUser = useSafeMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      setPendingActionUser(null);
      setIsDeleteConfirmOpen(false);
    },
  }, "Unable to delete operator.");

  const resetPassword = useSafeMutation({
    mutationFn: (id: string) => usersApi.resetPassword(id),
    onSuccess: () => {
      setPendingActionUser(null);
      setIsResetConfirmOpen(false);
      toast({ title: "Password reset", description: "Temporary password generated." });
    },
  }, "Unable to reset password.");

  const activateUser = useSafeMutation({
    mutationFn: (id: string) => usersApi.update(id, { is_active: true } as Partial<ApiUser>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      setPendingActionUser(null);
      setIsActivateConfirmOpen(false);
    },
  }, "Unable to activate operator.");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operators"
        description="Manage system operators and their permissions."
        actionLabel="Add Operator"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={() => {
          setSelectedUser(null);
          setIsFormOpen(true);
        }}
      />

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <SearchBar placeholder="Search operators..." onSearch={setSearchQuery} initialValue={searchQuery} />
        </div>
        <div className="text-sm text-muted-foreground">
          {isFetching ? "Refreshing..." : `${filtered.length} operators`}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-32" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No operators found" description="Try adjusting your search or add a new operator." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((operator: ApiUser) => (
            <Card key={operator.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-5 pb-3 flex flex-row items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">
                      {operator.first_name || operator.last_name
                        ? `${operator.first_name ?? ""} ${operator.last_name ?? ""}`.trim()
                        : operator.email}
                    </div>
                    <div className="text-xs text-muted-foreground">{operator.id}</div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUser(operator);
                        setIsFormOpen(true);
                      }}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {!operator.is_active && (
                      <DropdownMenuItem
                        onClick={() => {
                          setPendingActionUser(operator);
                          setIsActivateConfirmOpen(true);
                        }}
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Activate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        setPendingActionUser(operator);
                        setIsResetConfirmOpen(true);
                      }}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setPendingActionUser(operator);
                        setIsDeleteConfirmOpen(true);
                      }}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={roleColor[operator.role] ?? "bg-secondary"}>
                    <Shield className="h-3 w-3 mr-1" />
                    {operator.role}
                  </Badge>
                  {!operator.is_active && (
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/40">
                      Inactive
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{operator.email}</span>
                </div>
                {operator.department_id && (
                  <Badge variant="outline" className="text-xs">
                    Department: {operator.department_id}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{selectedUser ? "Edit Operator" : "Add Operator"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="operator@company.com"
                disabled={createOrUpdate.isPending}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  value={formData.first_name}
                  onChange={(e) => setFormData((p) => ({ ...p, first_name: e.target.value }))}
                  disabled={createOrUpdate.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  value={formData.last_name}
                  onChange={(e) => setFormData((p) => ({ ...p, last_name: e.target.value }))}
                  disabled={createOrUpdate.isPending}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(val) => setFormData((p) => ({ ...p, role: val }))}
                  disabled={createOrUpdate.isPending}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="OPERATOR">Operator</SelectItem>
                    <SelectItem value="DEPARTMENT">Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department ID</Label>
                <Input
                  id="department"
                  value={formData.department_id}
                  onChange={(e) => setFormData((p) => ({ ...p, department_id: e.target.value }))}
                  placeholder="optional"
                  disabled={createOrUpdate.isPending}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={createOrUpdate.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => createOrUpdate.mutate()}
              disabled={createOrUpdate.isPending || !formData.email.trim()}
            >
              {createOrUpdate.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title="Delete operator?"
        description={`This will remove ${pendingActionUser?.email ?? "the operator"}.`}
        confirmLabel="Delete"
        onCancel={() => {
          setPendingActionUser(null);
          setIsDeleteConfirmOpen(false);
        }}
        onConfirm={() => {
          if (pendingActionUser) deleteUser.mutate(pendingActionUser.id);
        }}
        isLoading={deleteUser.isPending}
      />

      <ConfirmDialog
        open={isResetConfirmOpen}
        title="Reset password?"
        description={`A temporary password will be generated for ${pendingActionUser?.email ?? "this operator"}.`}
        confirmLabel="Reset"
        onCancel={() => {
          setPendingActionUser(null);
          setIsResetConfirmOpen(false);
        }}
        onConfirm={() => {
          if (pendingActionUser) resetPassword.mutate(pendingActionUser.id);
        }}
        isLoading={resetPassword.isPending}
      />

      <ConfirmDialog
        open={isActivateConfirmOpen}
        title="Activate operator?"
        description={`Reactivate access for ${pendingActionUser?.email ?? "this operator"}.`}
        confirmLabel="Activate"
        onCancel={() => {
          setPendingActionUser(null);
          setIsActivateConfirmOpen(false);
        }}
        onConfirm={() => {
          if (pendingActionUser) activateUser.mutate(pendingActionUser.id);
        }}
        isLoading={activateUser.isPending}
      />
    </div>
  );
}
