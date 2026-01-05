import { useState } from "react";
import { Plus, Search, Mail, Clock, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserForm } from "@/components/users/UserForm";
import { InviteUserForm } from "@/components/users/InviteUserForm";
import { InvitationCard } from "@/components/users/InvitationCard";
import type { User } from "@/api/types";
import type { UserFormData, InviteFormData } from "@/types/user";
import { useUsersApi } from "@/hooks/useUsersApi";
import { UserCard } from "@/components/users/UserCard";
import { DeleteUserDialog } from "@/components/users/DeleteUserDialog";

export default function Users() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState("users");

    const { listUsers, createUser, updateUser, deleteUser, listInvitations, inviteUser } = useUsersApi();
    const { data, isLoading } = listUsers;
    const { data: invitationsData, isLoading: isLoadingInvitations } = listInvitations;
    const users = data?.items || [];
    const invitations = invitationsData?.items || [];

    const filteredUsers = users.filter((user) => {
        const query = searchQuery.toLowerCase();
        const { email, first_name, last_name, role } = user;

        return (
            query === "" ||
            email.toLowerCase().includes(query) ||
            (first_name || "").toLowerCase().includes(query) ||
            (last_name || "").toLowerCase().includes(query) ||
            role.toLowerCase().includes(query)
        );
    });

    const filteredInvitations = invitations.filter((invitation) => {
        const query = searchQuery.toLowerCase();
        const { email, role } = invitation;

        return (
            query === "" ||
            (email || "").toLowerCase().includes(query) ||
            (role || "").toLowerCase().includes(query)
        );
    });

    const handleCreateUser = (formData: UserFormData) => {
        createUser.mutate(
            {
                email: formData.email,
                password: formData.password || "",
                first_name: formData.first_name,
                last_name: formData.last_name,
                role: formData.role,
                department_id: formData.department_id || undefined,
            },
            {
                onSuccess: () => {
                    setIsCreateOpen(false);
                },
            }
        );
    };

    const handleInviteUser = (formData: InviteFormData) => {
        inviteUser.mutate(
            {
                email: formData.email,
                role: formData.role,
                department_id: formData.department_id || undefined,
            },
            {
                onSuccess: () => {
                    setIsInviteOpen(false);
                },
            }
        );
    };

    const handleUpdateUser = (formData: UserFormData) => {
        if (!editingUser) return;

        updateUser.mutate(
            {
                userId: editingUser.id,
                payload: {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    role: formData.role,
                    department_id: formData.department_id || undefined,
                    is_active: formData.is_active,
                },
            },
            {
                onSuccess: () => {
                    setEditingUser(null);
                },
            }
        );
    };

    const handleDeleteUser = () => {
        if (!deletingUser) return;

        deleteUser.mutate(deletingUser.id, {
            onSuccess: () => {
                setDeletingUser(null);
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Users Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage user accounts, roles, and permissions
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsCreateOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create User Directly
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsInviteOpen(true)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Invitation
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="users">
                        Active Users ({users.length})
                    </TabsTrigger>
                    <TabsTrigger value="invitations">
                        <Mail className="mr-2 h-4 w-4" />
                        Pending Invitations ({invitations.length})
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={activeTab === "users" ? "Search users by name, email, or role..." : "Search invitations by email or role..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {activeTab === "users"
                            ? `${filteredUsers.length} ${filteredUsers.length === 1 ? "user" : "users"}`
                            : `${filteredInvitations.length} ${filteredInvitations.length === 1 ? "invitation" : "invitations"}`
                        }
                    </div>
                </div>

                <TabsContent value="users" className="mt-6">
                    {isLoading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, idx) => (
                                <Skeleton key={idx} className="h-40" />
                            ))}
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No users found</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredUsers.map((user) => (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    onEdit={() => setEditingUser(user)}
                                    onDelete={() => setDeletingUser(user)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="invitations" className="mt-6">
                    {isLoadingInvitations ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, idx) => (
                                <Skeleton key={idx} className="h-32" />
                            ))}
                        </div>
                    ) : filteredInvitations.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No pending invitations</p>
                            <Button variant="outline" className="mt-4" onClick={() => setIsInviteOpen(true)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Send First Invitation
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredInvitations.map((invitation) => (
                                <InvitationCard
                                    key={invitation.id}
                                    invitation={invitation}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Create User Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                            Add a new user to the system with their role and permissions. The user will be created immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <UserForm
                        onSubmit={handleCreateUser}
                        onCancel={() => setIsCreateOpen(false)}
                        isLoading={createUser.isPending}
                    />
                </DialogContent>
            </Dialog>

            {/* Invite User Dialog */}
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite User</DialogTitle>
                        <DialogDescription>
                            Send an invitation email to a new user. They will receive a link to set up their account.
                        </DialogDescription>
                    </DialogHeader>
                    <InviteUserForm
                        onSubmit={handleInviteUser}
                        onCancel={() => setIsInviteOpen(false)}
                        isLoading={inviteUser.isPending}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information, role, and permissions.
                        </DialogDescription>
                    </DialogHeader>
                    <UserForm
                        user={editingUser}
                        onSubmit={handleUpdateUser}
                        onCancel={() => setEditingUser(null)}
                        isLoading={updateUser.isPending}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete User Dialog */}
            <DeleteUserDialog
                user={deletingUser}
                open={!!deletingUser}
                onOpenChange={(open) => !open && setDeletingUser(null)}
                onConfirm={handleDeleteUser}
            />
        </div>
    );
}