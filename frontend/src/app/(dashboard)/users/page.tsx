"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useUsers, useCreateUser } from "@/hooks/useUsers";
import { useAssets } from "@/hooks/useAssets";
import { useLoans } from "@/hooks/useLoans";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import { formatCurrency } from "@/lib/formatters";
import type { User } from "@/types";
import { AxiosError } from "axios";
import { toast } from "sonner";

function UserRow({ user, totalDeposited, totalBorrowed }: {
  user: User;
  totalDeposited: number;
  totalBorrowed: number;
}) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const utilization = totalDeposited > 0 ? totalBorrowed / (totalDeposited * 0.5) : 0;
  const statusLabel = utilization > 0.8 ? "High Risk" : utilization > 0 ? "Active" : "Investor";
  const statusColor =
    utilization > 0.8
      ? "bg-orange-50 text-orange-700 border-orange-100"
      : utilization > 0
        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : "bg-indigo-50 text-indigo-700 border-indigo-100";

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-xs">
            {initials}
          </div>
          <div>
            <p className="font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 font-medium text-slate-700">
        {formatCurrency(totalDeposited)}
      </td>
      <td className="px-6 py-4 text-slate-500">
        {formatCurrency(totalBorrowed)}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
          {statusLabel}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <Link
          href={`/users/${user.id}`}
          className="text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <Icon icon="mdi:chevron-right" className="w-5 h-5" />
        </Link>
      </td>
    </tr>
  );
}

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const { data: assets } = useAssets();
  const { data: loans } = useLoans();
  const createUser = useCreateUser();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  const handleCreate = () => {
    setFormError("");
    createUser.mutate(
      { name, email, password: password || undefined },
      {
        onSuccess: () => {
          setShowCreate(false);
          setName("");
          setEmail("");
          setPassword("");
          toast.success("User created successfully");
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<{ detail: string }>;
          const message = axiosErr.response?.data?.detail || "Failed to create user";
          setFormError(message);
          toast.error(message);
        },
      }
    );
  };

  function getUserTotals(userId: string) {
    const userAssets = assets?.filter((a) => a.user_id === userId) ?? [];
    const userLoans = loans?.filter((l) => l.user_id === userId) ?? [];
    const totalDeposited = userAssets.reduce((sum, a) => sum + a.value, 0);
    const totalBorrowed = userLoans.reduce((sum, l) => {
      if (l.status === "repaid") return sum;
      return sum + Math.max(l.amount - l.amount_repaid, 0);
    }, 0);
    return { totalDeposited, totalBorrowed };
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-1">
            {users?.length ?? 0} registered users
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
        >
          <Icon icon="mdi:plus" className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {!users?.length ? (
          <EmptyState title="No users yet" description="Create your first user to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Assets</th>
                  <th className="px-6 py-4">Loans</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((user) => {
                  const { totalDeposited, totalBorrowed } = getUserTotals(user.id);
                  return (
                    <UserRow
                      key={user.id}
                      user={user}
                      totalDeposited={totalDeposited}
                      totalBorrowed={totalBorrowed}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
              placeholder="Optional"
            />
          </div>
          {formError && (
            <p className="text-xs text-red-600">{formError}</p>
          )}
          <button
            onClick={handleCreate}
            disabled={createUser.isPending || !name || !email}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer"
          >
            {createUser.isPending ? "Creating..." : "Create User"}
          </button>
        </div>
      </Modal>
    </>
  );
}
