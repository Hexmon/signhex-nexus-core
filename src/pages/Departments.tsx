import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { DepartmentCard } from "@/components/departments/DepartmentCard";
import { DepartmentFormDialog } from "@/components/departments/DepartmentFormDialog";
import { departmentsApi } from "@/api/domains/departments";
import type { Department } from "@/api/types";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { queryKeys } from "@/api/queryKeys";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

const Departments = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => departmentsApi.list({ page: 1, limit: 50 }),
  });

  const departments = useMemo(() => data?.items ?? [], [data]);

  const createOrUpdate = useSafeMutation({
    mutationFn: async (payload: { values: { name: string; description?: string }; id?: string }) => {
      const trimmed = { ...payload.values, name: payload.values.name.trim(), description: payload.values.description?.trim() };
      if (!trimmed.name) {
        throw new Error("Name is required");
      }
      if (payload.id) {
        return departmentsApi.update(payload.id, trimmed);
      }
      return departmentsApi.create(trimmed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
      setFormOpen(false);
      setSelectedDepartment(null);
    },
  }, "Unable to save department.");

  const deleteDepartment = useSafeMutation({
    mutationFn: async (id: string) => departmentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
      setSelectedDepartment(null);
      setFormOpen(false);
      setIsConfirmOpen(false);
      setDeleteTarget(null);
    },
  }, "Unable to delete department.");

  const filteredDepartments = useMemo(
    () =>
      departments.filter((dept) =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [departments, searchQuery]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Management"
        description="Organize screens, users, and content by department"
        actionLabel="New Department"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={() => setFormOpen(true)}
      />

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[260px] max-w-md">
          <SearchBar placeholder="Search departments..." onSearch={setSearchQuery} initialValue={searchQuery} />
        </div>
        <div className="text-sm text-muted-foreground">
          {isFetching ? "Refreshing..." : `${filteredDepartments.length} departments`}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-40" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepartments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              onEdit={(d) => {
                setSelectedDepartment(d);
                setFormOpen(true);
              }}
                onDelete={(d) => {
                  setDeleteTarget(d);
                  setIsConfirmOpen(true);
                }}
            />
          ))}
          </div>

          {filteredDepartments.length === 0 && (
            <EmptyState title="No departments found" description="Try adjusting your search or create a new department." />
          )}
        </>
      )}

      <DepartmentFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
        isSubmitting={createOrUpdate.isPending}
        onSubmit={async (values, id) => {
          await createOrUpdate.mutateAsync({ values, id });
        }}
        onDelete={(deptId) => {
          if (!deptId) return;
          const dept = departments.find((d) => d.id === deptId) || selectedDepartment;
          if (dept) {
            setDeleteTarget(dept);
            setIsConfirmOpen(true);
          }
        }}
      />

      <ConfirmDialog
        open={isConfirmOpen}
        title="Delete department?"
        description={`This will permanently remove "${deleteTarget?.name ?? "this department"}".`}
        confirmLabel="Delete"
        onCancel={() => {
          setIsConfirmOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteDepartment.mutateAsync(deleteTarget.id);
        }}
        isLoading={deleteDepartment.isPending}
      />
    </div>
  );
};

export default Departments;
