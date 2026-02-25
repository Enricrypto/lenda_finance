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

const INPUT_CLASS = "w-full bg-background border border-white/8 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 placeholder:text-zinc-700";

function UserRow({ user, totalDeposited, totalBorrowed }: {
  user: User;
  totalDeposited: number;
  totalBorrowed: number;
}) {
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const utilization = totalDeposited > 0 ? totalBorrowed / (totalDeposited * 0.5) : 0;
  const statusLabel = utilization > 0.8 ? "High Risk" : utilization > 0 ? "Active" : "Investor";
  const statusColor =
    utilization > 0.8
      ? "bg-red-500/10 text-red-400 border-red-500/20"
      : utilization > 0
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";

  return (
    <tr className="hover:bg-white/3 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-medium text-xs">
            {initials}
          </div>
          <div>
            <p className="font-medium text-white">{user.name}</p>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-zinc-300">{formatCurrency(totalDeposited)}</td>
      <td className="px-6 py-4 text-zinc-500">{formatCurrency(totalBorrowed)}</td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
          {statusLabel}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <Link href={`/users/${user.id}`} className="text-zinc-600 hover:text-cyan-400 transition-colors">
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
          setName(""); setEmail(""); setPassword("");
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
          <h1 className="text-2xl font-semibold tracking-tight text-white">Users</h1>
          <p className="text-sm text-zinc-500 mt-1">{users?.length ?? 0} registered users</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors cursor-pointer"
        >
          <Icon icon="mdi:plus" className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-white/6 overflow-hidden">
        {!users?.length ? (
          <EmptyState title="No users yet" description="Create your first user to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/4 text-zinc-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Assets</th>
                  <th className="px-6 py-4 font-medium">Loans</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4 text-sm">
                {users.map((user) => {
                  const { totalDeposited, totalBorrowed } = getUserTotals(user.id);
                  return (
                    <UserRow key={user.id} user={user} totalDeposited={totalDeposited} totalBorrowed={totalBorrowed} />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create User">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLASS} placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT_CLASS} placeholder="Optional" />
          </div>
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <button
            onClick={handleCreate}
            disabled={createUser.isPending || !name || !email}
            className="w-full bg-white/8 hover:bg-white/12 disabled:opacity-50 border border-white/10 text-white font-medium py-2 rounded-lg text-sm transition-colors cursor-pointer"
          >
            {createUser.isPending ? "Creating..." : "Create User"}
          </button>
        </div>
      </Modal>
    </>
  );
}
