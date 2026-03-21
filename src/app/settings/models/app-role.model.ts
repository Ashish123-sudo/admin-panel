export interface AppRole {
  roleId?: string;  // Changed from number to string (UUID)
  roleName: string;
  description?: string;
}