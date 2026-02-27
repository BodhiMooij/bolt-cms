"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DangerZoneClient({
    spaceId,
    spaceName,
    canEdit,
}: {
    spaceId: string;
    spaceName: string;
    canEdit: boolean;
}) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (
            !confirm(
                `Delete project “${spaceName}”? All entries, components, and content types in this space will be removed.`
            )
        )
            return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/spaces/${spaceId}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(data.error ?? "Failed to delete project");
                return;
            }
            router.push("/admin");
            router.refresh();
        } finally {
            setDeleting(false);
        }
    };

    if (!canEdit) return null;

    return (
        <section className="border-t border-red-200 pt-10 dark:border-red-900/50">
            <h2 className="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">
                Danger zone
            </h2>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Permanently delete this space and all its entries, components, content types, and
                assets. This cannot be undone.
            </p>
            <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/30"
            >
                {deleting ? "Deleting…" : "Delete this space"}
            </button>
        </section>
    );
}
