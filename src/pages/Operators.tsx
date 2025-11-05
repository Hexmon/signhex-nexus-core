import { useState } from "react";
import { Search, Plus, MoreVertical, Shield, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OperatorFormDialog } from "@/components/operators/OperatorFormDialog";
import { DeleteOperatorDialog } from "@/components/operators/DeleteOperatorDialog";

type OperatorRole = "admin" | "manager" | "operator" | "viewer";
type OperatorStatus = "active" | "inactive";

interface Operator {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: OperatorRole;
  status: OperatorStatus;
  avatar?: string;
  department: string;
  lastActive: string;
}

const mockOperators: Operator[] = [
  {
    id: "OP-001",
    name: "John Smith",
    email: "john.smith@company.com",
    phone: "+1 (555) 123-4567",
    role: "admin",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    department: "IT",
    lastActive: "2024-03-15T14:30:00",
  },
  {
    id: "OP-002",
    name: "Sarah Johnson",
    email: "sarah.j@company.com",
    phone: "+1 (555) 234-5678",
    role: "manager",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    department: "Marketing",
    lastActive: "2024-03-15T13:15:00",
  },
  {
    id: "OP-003",
    name: "Michael Chen",
    email: "m.chen@company.com",
    phone: "+1 (555) 345-6789",
    role: "operator",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    department: "Operations",
    lastActive: "2024-03-15T12:00:00",
  },
  {
    id: "OP-004",
    name: "Emma Wilson",
    email: "emma.w@company.com",
    role: "viewer",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    department: "HR",
    lastActive: "2024-03-14T16:45:00",
  },
  {
    id: "OP-005",
    name: "David Miller",
    email: "david.m@company.com",
    phone: "+1 (555) 456-7890",
    role: "operator",
    status: "inactive",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    department: "IT",
    lastActive: "2024-03-10T09:30:00",
  },
];

const Operators = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);

  const filteredOperators = mockOperators.filter(
    (operator) =>
      operator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: OperatorRole) => {
    const variants = {
      admin: "default",
      manager: "secondary",
      operator: "outline",
      viewer: "outline",
    } as const;

    const colors = {
      admin: "bg-purple-100 text-purple-800 border-purple-200",
      manager: "bg-blue-100 text-blue-800 border-blue-200",
      operator: "bg-green-100 text-green-800 border-green-200",
      viewer: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <Badge variant={variants[role]} className={colors[role]}>
        <Shield className="mr-1 h-3 w-3" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: OperatorStatus) => {
    return (
      <Badge variant={status === "active" ? "default" : "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleEdit = (operator: Operator) => {
    setSelectedOperator(operator);
    setFormOpen(true);
  };

  const handleDelete = (operator: Operator) => {
    setSelectedOperator(operator);
    setDeleteDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedOperator(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operators</h1>
          <p className="text-muted-foreground">
            Manage system operators and their permissions
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Operator
        </Button>
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOperators.map((operator) => (
          <Card key={operator.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={operator.avatar} />
                  <AvatarFallback>
                    {operator.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(operator)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(operator)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{operator.name}</h3>
                  <p className="text-sm text-muted-foreground">{operator.id}</p>
                </div>

                <div className="flex gap-2">
                  {getRoleBadge(operator.role)}
                  {getStatusBadge(operator.status)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{operator.email}</span>
                  </div>
                  {operator.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{operator.phone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Department</span>
                    <span className="font-medium">{operator.department}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Last Active</span>
                    <span className="font-medium">
                      {new Date(operator.lastActive).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <OperatorFormDialog
        operator={selectedOperator}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <DeleteOperatorDialog
        operator={selectedOperator}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
};

export default Operators;
