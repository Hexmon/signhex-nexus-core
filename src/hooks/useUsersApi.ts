import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { usersApi, type UpdateUserPayload } from "@/api/domains/users";
import { ApiError } from "@/api/apiClient";
import type { RoleId } from "@/api/types";

export const useUsersApi = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    /* ============================
       Queries
    ============================ */

    const listUsers = useQuery({
        queryKey: ["users"],
        queryFn: () => usersApi.list({ page: 1, limit: 100 }),
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 0, // always refetch when invalidated
    });

    const listInvitations = useQuery({
        queryKey: ["invitations"],
        queryFn: () =>
            usersApi.listInvitations({
                status: "pending",
                page: 1,
                limit: 100,
            }),
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 0,
    });

    /* ============================
       Mutations
    ============================ */

    const createUser = useMutation({
        mutationFn: (payload: {
            email: string;
            password: string;
            first_name: string;
            last_name: string;
            role_id: RoleId;
            department_id?: string;
        }) => usersApi.create(payload),
        retry: false,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["users"] });

            toast({
                title: "User created",
                description: "The user has been successfully created.",
            });
        },
        onError: (error: Error | ApiError) => {
            toast({
                title: "Failed to create user",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const inviteUser = useMutation({
        mutationFn: (payload: {
            email: string;
            role_id: RoleId;
            department_id?: string;
        }) => usersApi.invite(payload),
        retry: false,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["invitations"] });

            toast({
                title: "Invitation sent",
                description: "The user has been invited successfully.",
            });
        },
        onError: (error: Error | ApiError) => {
            toast({
                title: "Failed to send invitation",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateUser = useMutation({
        mutationFn: ({
            userId,
            payload,
        }: {
            userId: string;
            payload: UpdateUserPayload;
        }) => usersApi.update(userId, payload),
        retry: false,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["users"] });

            toast({
                title: "User updated",
                description: "The user has been successfully updated.",
            });
        },
        onError: (error: Error | ApiError) => {
            toast({
                title: "Failed to update user",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteUser = useMutation({
        mutationFn: (userId: string) => usersApi.remove(userId),
        retry: false,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["users"] });

            toast({
                title: "User deleted",
                description: "The user has been successfully deleted.",
                variant: "destructive",
            });
        },
        onError: (error: Error | ApiError) => {
            toast({
                title: "Failed to delete user",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        listUsers,
        listInvitations,
        createUser,
        inviteUser,
        updateUser,
        deleteUser,
    };
};
