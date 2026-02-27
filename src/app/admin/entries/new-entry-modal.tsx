"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type ContentTypeOption = { id: string; name: string; type: string };

export function NewEntryModal({ spaceId }: { spaceId: string | null }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [contentTypes, setContentTypes] = useState<ContentTypeOption[]>([]);
    const [form, setForm] = useState({
        name: "",
        slug: "",
        contentTypeId: "",
    });

    useEffect(() => {
        if (!open || !spaceId) {
            setContentTypes([]);
            return;
        }
        fetch(`/api/content-types?space=${encodeURIComponent(spaceId)}`)
            .then((r) => (r.ok ? r.json() : []))
            .then(setContentTypes)
            .catch(() => setContentTypes([]));
    }, [open, spaceId]);

    const handleOpen = () => {
        setForm({ name: "", slug: "", contentTypeId: "" });
        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            alert("Name is required.");
            return;
        }
        if (!form.contentTypeId) {
            alert("Content type is required.");
            return;
        }
        if (!spaceId) return;
        setSaving(true);
        try {
            const res = await fetch("/api/entries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name.trim(),
                    slug: form.slug.trim() || undefined,
                    contentTypeId: form.contentTypeId,
                    spaceId,
                    content: { title: "", meta_description: "", body: [] },
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error ?? "Failed to create entry");
            }
            setOpen(false);
            router.push(
                `/admin/entries/${encodeURIComponent(data.slug)}${spaceId ? `?space=${spaceId}` : ""}`
            );
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to create entry");
        } finally {
            setSaving(false);
        }
    };

    const buttonClass =
        "min-h-[44px] shrink-0 flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600";
    const plusIcon = (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );

    if (!spaceId) {
        return (
            <Link href="/admin/entries/new" className={buttonClass}>
                {plusIcon}
                New entry
            </Link>
        );
    }

    return (
        <>
            <button type="button" onClick={handleOpen} className={buttonClass}>
                {plusIcon}
                New entry
            </button>
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => !saving && setOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="new-entry-modal-title"
                >
                    <div
                        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="new-entry-modal-title" className="mb-6 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                            New entry
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    className="min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                    placeholder="e.g. Home page"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Slug
                                </label>
                                <input
                                    type="text"
                                    value={form.slug}
                                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                                    className="min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                    placeholder="e.g. home, about, blog/my-post"
                                />
                                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    Leave empty to auto-generate from name.
                                </p>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Parent folder
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    className="min-h-[44px] w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400"
                                    placeholder="Future feature"
                                    aria-describedby="new-entry-parent-hint"
                                />
                                <p id="new-entry-parent-hint" className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    Coming soon.
                                </p>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Content type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.contentTypeId}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, contentTypeId: e.target.value }))
                                    }
                                    className="min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                    required
                                >
                                    <option value="">Choose content type…</option>
                                    {contentTypes.map((ct) => (
                                        <option key={ct.id} value={ct.id}>
                                            {ct.name} ({ct.type})
                                        </option>
                                    ))}
                                </select>
                                {contentTypes.length === 0 && (
                                    <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                                        No content types in this space.
                                    </p>
                                )}
                            </div>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="min-h-[44px] rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    {saving ? "Creating…" : "Create entry"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => !saving && setOpen(false)}
                                    className="min-h-[44px] rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
