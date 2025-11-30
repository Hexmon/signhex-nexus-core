import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Monitor, MoreVertical, Edit, MapPin, Trash2 } from "lucide-react";
import type { Department } from "@/api/types";

interface DepartmentCardProps {
  department: Department;
  onEdit: (dept: Department) => void;
  onDelete?: (dept: Department) => void;
}

export const DepartmentCard = ({ department, onEdit, onDelete }: DepartmentCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="space-y-1 flex-1">
          <h3 className="font-semibold text-lg text-foreground">{department.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {department.description || "No description provided."}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onEdit(department)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(department)}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Monitor className="h-4 w-4" />
          <span>Department ID</span>
          <Badge variant="outline">{department.id}</Badge>
        </div>
        {department.description && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>Managed content & screens</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
