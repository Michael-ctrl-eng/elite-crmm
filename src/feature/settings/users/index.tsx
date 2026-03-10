"use client";
import React, { useState, useEffect } from 'react';
import { Table, TableColumn } from '@/components/ui/Table';
import { UserType } from "./types/types";
import { UsersHeader } from './components/User-Header';
import { Search } from 'lucide-react';
import { DropDown } from '@/components/ui/DropDown';
import AddUser from './components/AddUser';
import { useSession } from 'next-auth/react';
import { isAdmin } from '@/libs/rbac';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  lastLogin: Date | null;
  createdAt: Date;
}

const columns: TableColumn<User>[] = [
  { 
    key: 'name', 
    title: 'User Name', 
    dataIndex: 'name', 
    sortable: true,
    render: (name) => name || 'No name'
  },
  { key: 'email', title: 'Email', dataIndex: 'email', sortable: true },
  { 
    key: 'role', 
    title: 'Role', 
    dataIndex: 'role', 
    sortable: false,
    render: (role) => {
      const colors: Record<string, string> = {
        ADMIN: 'bg-purple-100 text-purple-700',
        MANAGER: 'bg-blue-100 text-blue-700',
        VIEWER: 'bg-gray-100 text-gray-700',
      };
      return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
          {role}
        </span>
      );
    },
  },
  {
    key: 'status', 
    title: 'Status', 
    dataIndex: 'status', 
    sortable: false, 
    render: (status) => {
      const cls: Record<string, string> = {
        'Active': 'bg-green-100 text-green-700', 
        'Invite': 'bg-orange-100 text-orange-700', 
        'Inactive': 'bg-gray-100 text-gray-600', 
        'Deleted': 'bg-red-100 text-red-600', 
      };
      return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cls[status as string] || 'bg-gray-100 text-gray-600'}`}>
          {String(status)}
        </span>
      );
    },
  },
  { 
    key: 'lastLogin', 
    title: 'Last Login', 
    dataIndex: 'lastLogin', 
    sortable: false,
    render: (date) => date ? new Date(date as string).toLocaleDateString() : 'Never'
  },
];

const statusOptions = [
  { value: "all-status", label: "All Status" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Invite", label: "Pending Invite" },
]

const UsersFeat = () => {
  const { data: session } = useSession();
  const [statusFilter, setStatusFilter] = useState('all-status');
  const [showAddUser, setShowAddUser] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const canManageUsers = isAdmin(session?.user?.role as any);

  // Fetch users
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/tenant/users');
      if (!response.ok) throw new Error('Failed to load users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch invitations
  const loadInvitations = async () => {
    if (!canManageUsers) return;
    try {
      const response = await fetch('/api/tenant/invite');
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.filter((i: any) => i.status === 'pending'));
      }
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  };

  useEffect(() => {
    loadUsers();
    loadInvitations();
  }, []);

  const refreshUsers = async () => {
    await Promise.all([loadUsers(), loadInvitations()]);
    setSelectedUsers([]);
  };

  // Filter users by status and search
  const filteredUsers = users.filter(user => {
    const matchesStatus = statusFilter === 'all-status' || user.status === statusFilter;
    const matchesSearch = !searchQuery || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/tenant/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }
      
      toast.success('Role updated successfully');
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    
    try {
      const response = await fetch('/api/tenant/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      
      toast.success('User removed successfully');
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  // Handle selection change
  const handleSelectionChange = (selectedItems: string[], selectedRows: User[]) => {
    setSelectedUsers(selectedItems);
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  if (!canManageUsers) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Access Restricted</h2>
          <p className="text-yellow-700">Only administrators can manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!showAddUser ? (
        <>
          <UsersHeader
            handleAddUser={() => setShowAddUser(true)}
            selectedUsers={selectedUsers}
            onClearSelection={handleClearSelection}
            onUsersChange={refreshUsers}
          />
          
          <div className="px-6">
            <div className="border border-gray-200 rounded-xl p-4">
              {/* Search and Filters */}
              <div className="flex justify-between mb-4">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full h-9 bg-white border border-gray-200 rounded-md text-sm outline-none shadow-sm focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <DropDown
                  options={statusOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  className="h-9 w-auto"
                />
              </div>

              {/* Pending Invitations */}
              {invitations.length > 0 && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-800 mb-2">
                    Pending Invitations ({invitations.length})
                  </h3>
                  <div className="space-y-2">
                    {invitations.map((inv) => (
                      <div key={inv.id} className="flex justify-between items-center text-sm">
                        <span className="text-orange-700">{inv.email} - <span className="font-medium">{inv.role}</span></span>
                        <button 
                          onClick={async () => {
                            await fetch('/api/tenant/invite', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: inv.id }),
                            });
                            loadInvitations();
                          }}
                          className="text-orange-600 hover:text-orange-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Table */}
              <Table
                columns={columns}
                data={filteredUsers}
                selectable={true}
                loading={loading}
                onSelectionChange={handleSelectionChange}
              />

              {/* Pagination placeholder */}
              <div className="flex justify-between items-center py-3 border-t border-gray-100 mt-3">
                <p className="text-sm text-gray-500">
                  {loading ? 'Loading...' : `${filteredUsers.length} user(s)`}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <AddUser onClose={() => {
          setShowAddUser(false);
          refreshUsers();
        }} />
      )}
    </div>
  );
};

export default UsersFeat;
