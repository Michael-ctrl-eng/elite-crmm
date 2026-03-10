import { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import toast from 'react-hot-toast';

export default function AddUser({ onClose }: { onClose?: () => void }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('VIEWER');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!email) {
            setError('Email is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/tenant/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invitation');
            }

            toast.success('Invitation sent successfully');
            setEmail('');
            setRole('VIEWER');
            onClose?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send invitation');
            toast.error(err instanceof Error ? err.message : 'Failed to send invitation');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="py-8 px-6">
            {/* Back button */}
            <button 
                onClick={onClose}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Users</span>
            </button>

            <div className="border border-gray-200 rounded-xl max-w-lg">
                <h2 className="text-lg font-semibold text-gray-900 px-4 py-4">Invite Team Member</h2>
                <hr className="border-gray-200" />
                <div className="px-4 py-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            type="email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                        </label>
                        <select
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="VIEWER">Viewer - Read-only access</option>
                            <option value="MANAGER">Manager - Can manage deals, contacts, and tasks</option>
                            <option value="ADMIN">Admin - Full access including user management</option>
                        </select>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Role Permissions:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li><strong>Viewer:</strong> Can only view data, no editing</li>
                            <li><strong>Manager:</strong> Can create, edit, delete records</li>
                            <li><strong>Admin:</strong> Full access + user management</li>
                        </ul>
                    </div>

                    <Button
                        className="w-full bg-black hover:bg-gray-800"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        <span>Send Invitation</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
