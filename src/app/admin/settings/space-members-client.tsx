"use client";

import { useState } from "react";

type UserInfo = {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
};

type Member = {
    id: string;
    userId: string;
    role: string;
    user: UserInfo;
};

export function SpaceMembersClient({
    spaceId,
    currentUserId,
    canManage,
    owner,
    initialMembers,
}: {
    spaceId: string;
    currentUserId: string;
    canManage: boolean;
    owner: UserInfo;
    initialMembers: Member[];
}) {
    const [members, setMembers] = useState(initialMembers);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"editor" | "viewer">("editor");
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const addMember = async () => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) return;
        setError(null);
        setAdding(true);
        try {
            const res = await fetch(`/api/spaces/${spaceId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: trimmed, role }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to add");
            setMembers((prev) => [...prev, { id: data.id, userId: data.userId, role: data.role, user: data.user }]);
            setEmail("");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to add");
        } finally {
            setAdding(false);
        }
    };

    const removeMember = async (userId: string) => {
        setRemoving(userId);
        setError(null);
        try {
            const res = await fetch(`/api/spaces/${spaceId}/members/${userId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to remove");
            setMembers((prev) => prev.filter((m) => m.userId !== userId));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to remove");
        } finally {
            setRemoving(null);
        }
    };

    return (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                <li className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                        {owner.image ? (
                            <img
                                src={owner.image}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover"
                            />
                        ) : (
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                                {(owner.name ?? owner.email ?? "?")[0].toUpperCase()}
                            </span>
                        )}
                        <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                                {owner.name ?? owner.email ?? "Owner"}
                            </p>
                            {owner.email && (
                                <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                                    {owner.email}
                                </p>
                            )}
                        </div>
                    </div>
                    <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                        Owner
                    </span>
                </li>
                {members.map((m) => (
                    <li
                        key={m.id}
                        className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            {m.user.image ? (
                                <img
                                    src={m.user.image}
                                    alt=""
                                    className="h-8 w-8 rounded-full object-cover"
                                />
                            ) : (
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                                    {(m.user.name ?? m.user.email ?? "?")[0].toUpperCase()}
                                </span>
                            )}
                            <div className="min-w-0">
                                <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                                    {m.user.name ?? m.user.email ?? "User"}
                                </p>
                                {m.user.email && (
                                    <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                                        {m.user.email}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                                {m.role}
                            </span>
                            {canManage && m.userId !== currentUserId && (
                                <button
                                    type="button"
                                    onClick={() => removeMember(m.userId)}
                                    disabled={removing === m.userId}
                                    className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 disabled:opacity-50"
                                >
                                    {removing === m.userId ? "…" : "Remove"}
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
            {canManage && (
                <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                    {error && (
                        <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                    )}
                    <div className="flex flex-wrap items-end gap-2">
                        <label className="flex flex-1 min-w-[120px] flex-col gap-1">
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">Email</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="collaborator@example.com"
                                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">Role</span>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
                                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            >
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={addMember}
                            disabled={adding || !email.trim()}
                            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            {adding ? "Adding…" : "Add"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
