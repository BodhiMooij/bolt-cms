"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SpaceNameClient({
    spaceId,
    initialName,
    canEdit,
}: {
    spaceId: string;
    initialName: string;
    canEdit: boolean;
}) {
    const router = useRouter();
    const [name, setName] = useState(initialName);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (trimmed === initialName) return;
        setError(null);
        setSaving(true);
        try {
            const res = await fetch(`/api/spaces/${spaceId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmed }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error ?? "Failed to update name");
                return;
            }
            router.refresh();
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Space name
            </h2>
            {canEdit ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label
                            htmlFor="space-name"
                            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                            Name
                        </label>
                        <input
                            id="space-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                            placeholder="e.g. Marketing"
                            required
                            disabled={saving}
                        />
                    <button
                        type="submit"
                        disabled={saving || name.trim() === initialName}
                        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                    </div>
                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    )}
                </form>
            ) : (
                <p className="text-zinc-700 dark:text-zinc-300">{initialName}</p>
            )}
        </section>
    );
}
