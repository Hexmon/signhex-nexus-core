import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Mail, Shield, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usersApi } from "@/api/domains/users";
import { Skeleton } from "@/components/ui/skeleton";
import type { User as ApiUser } from "@/api/types";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/api/apiClient";
import { useEffect } from "react";

const roleColor: Record<string, string> = {
  ADMIN: "bg-purple-500/10 text-purple-700",
  OPERATOR: "bg-blue-500/10 text-blue-700",
  DEPARTMENT: "bg-emerald-500/10 text-emerald-700",
};

export default function Operators() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["users"],
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operators</h1>
          <p className="text-muted-foreground">Manage system operators and their permissions.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search operators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((operator: ApiUser) => (
            <Card key={operator.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                  <Badge className={roleColor[operator.role] ?? "bg-secondary"}>
                    <Shield className="h-3 w-3 mr-1" />
                    {operator.role}
                  </Badge>
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
    </div>
  );
}
