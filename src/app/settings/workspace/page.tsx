"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Building2, Users, FileText, TrendingUp, Calendar } from 'lucide-react';
import { isAdmin } from '@/libs/rbac';
import toast from 'react-hot-toast';

interface TenantStats {
  users: number;
  deals: number;
  customers: number;
  companies: number;
  prospects: number;
  meetings: number;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  maxUsers: number;
  active: boolean;
  createdAt: string;
  _count?: TenantStats;
}

export default function WorkspaceSettings() {
  const { data: session } = useSession();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  const canEdit = isAdmin(session?.user?.role as any);

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      const response = await fetch('/api/tenant');
      if (!response.ok) throw new Error('Failed to load workspace');
      const data = await response.json();
      setTenant(data);
      setName(data.name);
    } catch (error) {
      console.error('Failed to load tenant:', error);
      toast.error('Failed to load workspace settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/tenant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error('Failed to update workspace');
      
      toast.success('Workspace updated successfully');
      loadTenant();
    } catch (error) {
      toast.error('Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const stats = tenant?._count || { users: 0, deals: 0, customers: 0, companies: 0, prospects: 0, meetings: 0 };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Workspace Settings</h1>

      {/* Workspace Info Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{tenant?.name}</h2>
            <p className="text-sm text-gray-500">Workspace ID: {tenant?.slug}</p>
          </div>
          <div className="ml-auto">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              tenant?.active 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {tenant?.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {canEdit && (
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter workspace name"
              />
              <button
                onClick={handleSave}
                disabled={saving || name === tenant?.name}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Team Members"
          value={stats.users}
          max={tenant?.maxUsers}
        />
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Deals"
          value={stats.deals}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Prospects"
          value={stats.prospects}
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Customers"
          value={stats.customers}
        />
        <StatCard
          icon={<Building2 className="w-5 h-5" />}
          label="Companies"
          value={stats.companies}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Meetings"
          value={stats.meetings}
        />
      </div>

      {/* Plan Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900 capitalize">{tenant?.plan}</p>
            <p className="text-sm text-gray-500">Up to {tenant?.maxUsers} team members</p>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  max 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  max?: number;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {max && <span className="text-sm font-normal text-gray-400">/{max}</span>}
      </p>
    </div>
  );
}
