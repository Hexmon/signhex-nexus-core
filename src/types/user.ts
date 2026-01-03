import type { Role } from "@/api/types";

export interface UserFormData {
    email: string;
    password?: string;
    first_name: string;
    last_name: string;
    role: Role;
    department_id?: string;
    is_active?: boolean;
}

export interface InviteFormData {
    email: string;
    role: Role;
    department_id?: string;
}