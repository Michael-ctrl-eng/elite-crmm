export type User = {
    id: string
    name: string | null
    email: string
    password: string
    status?: 'Active' | 'Inactive' | 'Invite' | 'Deleted'
    lastLogin?: Date
    createdAt: Date
    updatedAt: Date
  }
  