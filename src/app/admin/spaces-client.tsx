"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Space = {
    id: string;
    name: string;
    identifier: string;
    _count: { entries: number; components: number; contentTypes: number };
};

function SpaceIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
        </svg>
    );
}

export function SpacesClient({ spaces }: { spaces: Space[] }) {
    const router = useRouter();
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState("");
    const [identifier, setIdentifier] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingSpace, setEditingSpace] = useState<Space | null>(null);
    const [editName, setEditName] = useState("");
    const [editIdentifier, setEditIdentifier] = useState("");
    const [editError, setEditError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        setCreating(true);
        try {
            const res = await fetch("/api/spaces", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    identifier:
                        identifier.trim() ||
                        name
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, "-")
                            .replace(/[^a-z0-9-_]/g, "") ||
                        "space",
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setCreateError(data.error ?? "Failed to create project");
                return;
            }
            setName("");
            setIdentifier("");
            router.refresh();
        } finally {
            setCreating(false);
        }
    };

    const openEdit = (space: Space) => {
        setEditingSpace(space);
        setEditName(space.name);
        setEditIdentifier(space.identifier);
        setEditError(null);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSpace) return;
        setEditError(null);
        setSaving(true);
        try {
            const res = await fetch(`/api/spaces/${editingSpace.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim(),
                    identifier:
                        editIdentifier.trim() ||
                        editName
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, "-")
                            .replace(/[^a-z0-9-_]/g, "") ||
                        editingSpace.identifier,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setEditError(data.error ?? "Failed to update project");
                return;
            }
            setEditingSpace(null);
            router.refresh();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, spaceName: string) => {
        if (
            !confirm(
                `Delete project “${spaceName}”? All entries, components, and content types in this space will be removed.`
            )
        )
            return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/spaces/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(data.error ?? "Failed to delete project");
                return;
            }
            router.refresh();
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    New project
                </h2>
                <form
                    onSubmit={handleCreate}
                    className="flex flex-col gap-4 sm:flex-row sm:items-end"
                >
                    <div className="flex-1 space-y-2">
                        <label
                            htmlFor="new-space-name"
                            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                            Name
                        </label>
                        <input
                            id="new-space-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Marketing"
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                            required
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label
                            htmlFor="new-space-identifier"
                            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                            Identifier
                        </label>
                        <input
                            id="new-space-identifier"
                            type="text"
                            value={identifier}
                            onChange={(e) =>
                                setIdentifier(
                                    e.target.value
                                        .toLowerCase()
                                        .replace(/\s+/g, "-")
                                        .replace(/[^a-z0-9-_]/g, "")
                                )
                            }
                            placeholder="e.g. marketing"
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 placeholder-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={creating}
                        className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
                    >
                        {creating ? "Creating…" : "Create project"}
                    </button>
                </form>
                {createError && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createError}</p>
                )}
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
                {spaces.map((space) => (
                    <li key={space.id} className="relative">
                        <Link
                            href={`/admin/entries?space=${space.id}`}
                            className="block rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                        >
                            <span className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                                    <SpaceIcon className="h-5 w-5" />
                                </span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                                    {space.name}
                                </span>
                            </span>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                {space.identifier}
                            </p>
                            <dl className="mt-4 flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                                <span>{space._count.entries} entries</span>
                                <span>{space._count.components} components</span>
                                <span>{space._count.contentTypes} content types</span>
                            </dl>
                        </Link>
                        <div className="absolute right-4 top-4 flex gap-1">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openEdit(space);
                                }}
                                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                                title="Edit project"
                                aria-label={`Edit ${space.name}`}
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                                    />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDelete(space.id, space.name);
                                }}
                                disabled={deletingId === space.id}
                                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                                title="Delete project"
                                aria-label={`Delete ${space.name}`}
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                    />
                                </svg>
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {editingSpace && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => !saving && setEditingSpace(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="edit-space-title"
                >
                    <div
                        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2
                            id="edit-space-title"
                            className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                        >
                            Edit project
                        </h2>
                        <form onSubmit={handleEdit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="edit-space-name"
                                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    Name
                                </label>
                                <input
                                    id="edit-space-name"
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="edit-space-identifier"
                                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    Identifier
                                </label>
                                <input
                                    id="edit-space-identifier"
                                    type="text"
                                    value={editIdentifier}
                                    onChange={(e) =>
                                        setEditIdentifier(
                                            e.target.value
                                                .toLowerCase()
                                                .replace(/\s+/g, "-")
                                                .replace(/[^a-z0-9-_]/g, "")
                                        )
                                    }
                                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                />
                            </div>
                            {editError && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {editError}
                                </p>
                            )}
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingSpace(null)}
                                    disabled={saving}
                                    className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
                                >
                                    {saving ? "Saving…" : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
