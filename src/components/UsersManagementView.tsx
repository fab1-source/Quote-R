import React, { useState } from 'react';
import {
  UserCheck,
  Shield,
  UserPlus,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit2,
  Check,
  X,
  Trash2,
  ClipboardList,
  FileText,
  Calculator,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import {
  getUsers,
  addUser,
  updateUserPassword,
  toggleUserStatus,
  deleteUser,
  updateUserRole
} from '../utils/userStorage';

interface UsersManagementViewProps {
  currentUser: UserAccount;
  onRefreshCurrentUser?: () => void;
  onNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  currentUser,
  onRefreshCurrentUser,
  onNotification = (_msg: string, _type?: 'success' | 'info' | 'warning' | 'error') => {}
}) => {
  const [users, setUsers] = useState<UserAccount[]>(() => getUsers());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('ESTIMATION');
  const [newName, setNewName] = useState('');
  const [formError, setFormError] = useState('');

  // Password inline editing state
  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null);
  const [passwordDraft, setPasswordDraft] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: string]: boolean }>({});

  const reloadUsers = () => {
    const updated = getUsers();
    setUsers(updated);
    if (onRefreshCurrentUser) {
      onRefreshCurrentUser();
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Start editing a user's password
  const handleStartEditPassword = (user: UserAccount) => {
    setEditingPasswordUserId(user.id);
    setPasswordDraft(user.password);
  };

  const handleSavePassword = (userId: string) => {
    if (!passwordDraft.trim()) {
      onNotification('Password cannot be empty', 'error');
      return;
    }
    const res = updateUserPassword(userId, passwordDraft.trim());
    if (res.success) {
      onNotification('Password updated successfully', 'success');
      setEditingPasswordUserId(null);
      setPasswordDraft('');
      reloadUsers();
    } else {
      onNotification(res.error || 'Failed to update password', 'error');
    }
  };

  const handleCancelEditPassword = () => {
    setEditingPasswordUserId(null);
    setPasswordDraft('');
  };

  // Toggle user activation status
  const handleToggleStatus = (targetUser: UserAccount) => {
    if (targetUser.id === currentUser.id || targetUser.username.toUpperCase() === currentUser.username.toUpperCase()) {
      onNotification('Security restriction: You cannot deactivate your own account', 'warning');
      return;
    }

    const res = toggleUserStatus(targetUser.id, currentUser.id);
    if (res.success) {
      const stateWord = res.newStatus ? 'activated' : 'deactivated';
      onNotification(`User ${targetUser.username} has been ${stateWord}`, 'info');
      reloadUsers();
    } else {
      onNotification(res.error || 'Failed to update status', 'error');
    }
  };

  // Change Role
  const handleChangeRole = (userId: string, newRoleValue: UserRole) => {
    const res = updateUserRole(userId, newRoleValue, currentUser.id);
    if (res.success) {
      onNotification('Access level updated successfully', 'success');
      reloadUsers();
    } else {
      onNotification(res.error || 'Failed to update role', 'error');
    }
  };

  // Delete User
  const handleDeleteUser = (targetUser: UserAccount) => {
    if (targetUser.id === currentUser.id) {
      onNotification('Cannot delete your own account', 'error');
      return;
    }
    if (['HOD', 'ESTIMATOR1', 'FACTORY1'].includes(targetUser.username.toUpperCase())) {
      const proceed = window.confirm(
        `"${targetUser.username}" is a default system user. Are you sure you want to delete this user?`
      );
      if (!proceed) return;
    } else {
      const proceed = window.confirm(`Delete user "${targetUser.username}"?`);
      if (!proceed) return;
    }

    const res = deleteUser(targetUser.id, currentUser.id);
    if (res.success) {
      onNotification(`User ${targetUser.username} removed`, 'info');
      reloadUsers();
    } else {
      onNotification(res.error || 'Failed to delete user', 'error');
    }
  };

  // Create new user
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newUsername.trim()) {
      setFormError('Username is required.');
      return;
    }
    if (!newPassword.trim()) {
      setFormError('Password is required.');
      return;
    }

    const res = addUser({
      username: newUsername.trim(),
      password: newPassword.trim(),
      role: newRole,
      name: newName.trim(),
    });

    if (!res.success) {
      setFormError(res.error || 'Failed to create user');
      return;
    }

    onNotification(`User "${newUsername}" created successfully with ${newRole} access level`, 'success');
    setNewUsername('');
    setNewPassword('');
    setNewName('');
    setNewRole('ESTIMATION');
    setIsAddModalOpen(false);
    reloadUsers();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-red-100 text-[#7B1818] rounded-lg">
              <Shield className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">User Management & Permissions</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-[#7B1818] border border-red-200">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Configure system access for Inter Glass personnel. Manage credentials, assign access control levels, and toggle account activation. Passwords can be viewed and edited directly below.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError('');
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 bg-[#7B1818] hover:bg-[#8F1D1D] text-white font-bold text-xs rounded-lg shadow-2xs hover:shadow-sm transition flex items-center gap-2 cursor-pointer self-start md:self-auto shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* 3 Access Control Levels Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ADMIN */}
        <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2 py-0.5 rounded bg-red-700 text-white font-bold text-[10px] tracking-wider uppercase">
              ADMIN Level
            </span>
            <span className="font-bold text-red-900">Full Access</span>
          </div>
          <p className="text-red-900 font-medium leading-relaxed">
            • Complete access to all portal features.<br />
            • Can <strong>confirm</strong> AND <strong>unconfirm</strong> orders.<br />
            • Has exclusive access to the <strong>"Users"</strong> tab to manage accounts and passwords.
          </p>
        </div>

        {/* ESTIMATION */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2 py-0.5 rounded bg-blue-700 text-white font-bold text-[10px] tracking-wider uppercase">
              ESTIMATION Level
            </span>
            <span className="font-bold text-blue-900">Quoting & Costing</span>
          </div>
          <p className="text-blue-900 font-medium leading-relaxed">
            • Access to Quotations Portal, Cost Sheet, and Job Cards.<br />
            • Can <strong>confirm</strong> an order.<br />
            • <strong>Cannot un-confirm</strong> orders (locked once confirmed).<br />
            • "Users" tab is hidden.
          </p>
        </div>

        {/* PRODUCTION */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold text-[10px] tracking-wider uppercase">
              PRODUCTION Level
            </span>
            <span className="font-bold text-emerald-900">Job Cards Only</span>
          </div>
          <p className="text-emerald-900 font-medium leading-relaxed">
            • <strong>Can ONLY access JOB CARDS tab</strong>.<br />
            • No other tabs (Quotations, Cost Sheet, Users) are visible.<br />
            • Zero access to financial amounts or commercial terms.<br />
            • Pure factory production view.
          </p>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Registered Portal Users ({users.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Current user: <strong className="text-slate-800">{currentUser.username}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/90 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Username & Info</th>
                <th className="px-4 py-3">Access Level</th>
                <th className="px-4 py-3">Password (Editable)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => {
                const isSelf = user.id === currentUser.id || user.username.toUpperCase() === currentUser.username.toUpperCase();
                const isEditingPassword = editingPasswordUserId === user.id;
                const isPasswordVisible = visiblePasswords[user.id] || false;

                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${
                      !user.isActive
                        ? 'bg-slate-50/60 opacity-60'
                        : isSelf
                        ? 'bg-amber-50/40'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* User info */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            user.role === 'ADMIN'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : user.role === 'ESTIMATION'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{user.username}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {user.name || 'Interglass User'} • Registered: {user.createdAt || 'Default'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Access Level */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                          className={`text-xs font-bold py-1 px-2 rounded-lg border focus:outline-none cursor-pointer ${
                            user.role === 'ADMIN'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : user.role === 'ESTIMATION'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="ESTIMATION">ESTIMATION</option>
                          <option value="PRODUCTION">PRODUCTION</option>
                        </select>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {user.role === 'ADMIN'
                          ? 'Can confirm & unconfirm + Users tab'
                          : user.role === 'ESTIMATION'
                          ? 'Can confirm, cannot unconfirm'
                          : 'Job Cards tab only'}
                      </div>
                    </td>

                    {/* Password */}
                    <td className="px-4 py-3.5">
                      {isEditingPassword ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={passwordDraft}
                            onChange={(e) => setPasswordDraft(e.target.value)}
                            placeholder="Enter new password"
                            className="px-2.5 py-1 text-xs border border-[#7B1818] rounded-md focus:outline-none focus:ring-1 focus:ring-[#7B1818] bg-white font-mono"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePassword(user.id)}
                            className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                            title="Save Password"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditPassword}
                            className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            {isPasswordVisible ? user.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                            title={isPasswordVisible ? 'Hide Password' : 'Show Password'}
                          >
                            {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditPassword(user)}
                            className="text-indigo-600 hover:text-indigo-800 font-medium text-[11px] flex items-center gap-0.5 hover:underline cursor-pointer ml-1"
                            title="Change password"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700 border border-slate-300">
                          <XCircle className="w-3 h-3 text-slate-500" />
                          Deactivated
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Activate / Deactivate button */}
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => handleToggleStatus(user)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer border ${
                            isSelf
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                              : user.isActive
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                          title={isSelf ? 'Cannot deactivate your own account' : user.isActive ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        {/* Delete User */}
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#7B1818] to-[#991B1B] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Add New Portal User</h3>
                  <p className="text-xs text-red-100">Create login credentials and set role permissions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. ESTIMATOR2, FACTORY2, ACCOUNTS1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#7B1818] focus:ring-1 focus:ring-[#7B1818] text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter initial password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#7B1818] focus:ring-1 focus:ring-[#7B1818] text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name / Description (Optional)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Junior Glass Estimator"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#7B1818] focus:ring-1 focus:ring-[#7B1818] text-sm"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Access Level & Role *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {/* ADMIN */}
                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition flex items-start gap-3 ${
                      newRole === 'ADMIN'
                        ? 'bg-red-50/80 border-red-400 ring-1 ring-red-400'
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      value="ADMIN"
                      checked={newRole === 'ADMIN'}
                      onChange={() => setNewRole('ADMIN')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-red-700 text-white text-[10px] font-bold uppercase">
                          ADMIN
                        </span>
                        <span>Complete Access</span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Can access all views, confirm & unconfirm orders, and manage users.
                      </div>
                    </div>
                  </label>

                  {/* ESTIMATION */}
                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition flex items-start gap-3 ${
                      newRole === 'ESTIMATION'
                        ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400'
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      value="ESTIMATION"
                      checked={newRole === 'ESTIMATION'}
                      onChange={() => setNewRole('ESTIMATION')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-blue-700 text-white text-[10px] font-bold uppercase">
                          ESTIMATION
                        </span>
                        <span>Quoting & Pricing</span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Can create/edit quotations, cost sheet, and confirm orders. Cannot unconfirm. No Users tab.
                      </div>
                    </div>
                  </label>

                  {/* PRODUCTION */}
                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition flex items-start gap-3 ${
                      newRole === 'PRODUCTION'
                        ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400'
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      value="PRODUCTION"
                      checked={newRole === 'PRODUCTION'}
                      onChange={() => setNewRole('PRODUCTION')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-bold uppercase">
                          PRODUCTION
                        </span>
                        <span>Job Cards Only</span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Strictly Job Cards tab only. No access to quotations, pricing, cost sheets, or user management.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7B1818] hover:bg-[#8F1D1D] text-white rounded-lg font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Create User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
