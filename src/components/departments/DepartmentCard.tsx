import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Monitor, Users, HardDrive, MoreVertical, Edit, ArrowRightLeft, Trash2, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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

interface DepartmentCardProps {
  department: Department;
  onEdit: (dept: Department) => void;
  onTransfer: (dept: Department) => void;
  onDelete: (dept: Department) => void;
}

export const DepartmentCard = ({ department, onEdit, onTransfer, onDelete }: DepartmentCardProps) => {
  const storageUsedNum = parseFloat(department.storageUsed);
  const storageQuotaNum = parseFloat(department.storageQuota);
  const storagePercent = (storageUsedNum / storageQuotaNum) * 100;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="space-y-1 flex-1">
          <h3 className="font-semibold text-lg text-foreground">{department.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{department.description}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2">
              <Eye className="h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(department)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTransfer(department)} className="gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Transfer Screens
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(department)}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Monitor className="h-4 w-4" />
            <span className="font-medium text-foreground">{department.screenCount}</span>
            <span>screens</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="font-medium text-foreground">
              {department.owners.length + department.operators.length}
            </span>
            <span>members</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HardDrive className="h-4 w-4" />
              <span>Storage</span>
            </div>
            <span className="font-medium text-foreground">
              {department.storageUsed} / {department.storageQuota}
            </span>
          </div>
          <Progress value={storagePercent} className="h-2" />
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Owners</span>
            <span className="font-medium text-foreground">{department.owners.length}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {department.owners.slice(0, 2).map((owner) => (
              <Badge key={owner} variant="secondary" className="text-xs">
                {owner}
              </Badge>
            ))}
            {department.owners.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{department.owners.length - 2}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
