"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

type Entry = {
    id: string;
    slug: string;
    name: string;
    content: Record<string, unknown>;
    isPublished: boolean;
    contentType: { type: string };
};

type BlockOption = { id: string; name: string; type: string };
type ContentTypeOption = { id: string; name: string; type: string };

export default function EditEntryPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const spaceId = searchParams.get("space");
    const slug = decodeURIComponent((params.slug as string) ?? "");
    const isNew = slug === "new";

    const [entry, setEntry] = useState<Entry | null>(null);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", slug: "", content: "" });
    const [newEntryForm, setNewEntryForm] = useState({
        name: "",
        slug: "",
        contentTypeId: "",
    });
    const [contentTypes, setContentTypes] = useState<ContentTypeOption[]>([]);
    const [blocks, setBlocks] = useState<BlockOption[]>([]);

    useEffect(() => {
        if (isNew) {
            setNewEntryForm({ name: "", slug: "", contentTypeId: "" });
            setLoading(false);
            return;
        }
        const url = spaceId
            ? `/api/entries/${encodeURIComponent(slug)}?space=${encodeURIComponent(spaceId)}`
            : `/api/entries/${encodeURIComponent(slug)}`;
        fetch(url)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Not found"))))
            .then((data) => {
                setEntry(data);
                setForm({
                    name: data.name,
                    slug: data.slug,
                    content:
                        typeof data.content === "string"
                            ? data.content
                            : JSON.stringify(data.content, null, 2),
                });
            })
            .catch(() => setEntry(null))
            .finally(() => setLoading(false));
    }, [slug, isNew, spaceId]);

    useEffect(() => {
        if (!spaceId) {
            setBlocks([]);
            return;
        }
        const url = `/api/components?space=${encodeURIComponent(spaceId)}`;
        fetch(url)
            .then((r) => (r.ok ? r.json() : []))
            .then((list: Array<{ id: string; name: string; type: string }>) =>
                setBlocks(list.map((b) => ({ id: b.id, name: b.name, type: b.type })))
            )
            .catch(() => setBlocks([]));
    }, [spaceId]);

    useEffect(() => {
        if (!isNew || !spaceId) {
            setContentTypes([]);
            return;
        }
        const url = `/api/content-types?space=${encodeURIComponent(spaceId)}`;
        fetch(url)
            .then((r) => (r.ok ? r.json() : []))
            .then((list: Array<{ id: string; name: string; type: string }>) => setContentTypes(list))
            .catch(() => setContentTypes([]));
    }, [isNew, spaceId]);

    const createEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEntryForm.name.trim()) {
            alert("Name is required.");
            return;
        }
        if (!newEntryForm.contentTypeId) {
            alert("Content type is required.");
            return;
        }
        if (!spaceId) {
            alert("A space must be selected. Go to Entries and choose a space.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/entries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newEntryForm.name.trim(),
                    slug: newEntryForm.slug.trim() || undefined,
                    contentTypeId: newEntryForm.contentTypeId,
                    spaceId,
                    content: { title: "", meta_description: "", body: [] },
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error ?? "Failed to create entry");
            }
            router.replace(
                `/admin/entries/${encodeURIComponent(data.slug)}${spaceId ? `?space=${spaceId}` : ""}`
            );
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to create entry");
        } finally {
            setSaving(false);
        }
    };

    const addBlockToEntry = (block: BlockOption) => {
        let content: Record<string, unknown>;
        try {
            content = JSON.parse(form.content) as Record<string, unknown>;
        } catch {
            return;
        }
        const body = Array.isArray(content.body) ? content.body : [];
        const newBlock = {
            type: block.type,
            _uid: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `block-${Date.now()}`,
        };
        setForm((f) => ({
            ...f,
            content: JSON.stringify({ ...content, body: [...body, newBlock] }, null, 2),
        }));
    };

    const save = async () => {
        setSaving(true);
        try {
            let content: unknown;
            try {
                content = JSON.parse(form.content);
            } catch {
                alert("Invalid JSON in content");
                setSaving(false);
                return;
            }
            const url = isNew ? "/api/entries" : `/api/entries/${encodeURIComponent(slug)}`;
            const method = isNew ? "POST" : "PUT";
            const body: Record<string, unknown> = isNew
                ? { name: form.name, slug: form.slug, content }
                : { name: form.name, slug: form.slug, content };
            if (spaceId) body.spaceId = spaceId;
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error ?? res.statusText);
            }
            const data = await res.json();
            if (isNew)
                router.replace(
                    `/admin/entries/${encodeURIComponent(data.slug)}${spaceId ? `?space=${spaceId}` : ""}`
                );
            else setEntry(data);
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-zinc-500 dark:text-zinc-400">Loading…</div>;
    }

    if (!isNew && !entry) {
        return (
            <div>
                <p className="text-zinc-600 dark:text-zinc-400">Entry not found.</p>
                <Link
                    href={spaceId ? `/admin/entries?space=${spaceId}` : "/admin/entries"}
                    className="mt-4 inline-block text-zinc-900 underline dark:text-zinc-100"
                >
                    Back to entries
                </Link>
            </div>
        );
    }

    if (isNew) {
        return (
            <div className="px-4 py-6 sm:px-6">
                <div className="mb-6">
                    <Link
                        href={spaceId ? `/admin/entries?space=${spaceId}` : "/admin/entries"}
                        className="inline-block min-h-[44px] text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                        ← Entries
                    </Link>
                </div>
                <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                    <h1 className="mb-6 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                        New entry
                    </h1>
                    {!spaceId ? (
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Select a space from Entries to create an entry.
                        </p>
                    ) : (
                        <form onSubmit={createEntry} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newEntryForm.name}
                                    onChange={(e) =>
                                        setNewEntryForm((f) => ({ ...f, name: e.target.value }))
                                    }
                                    className="min-h-[44px] w-full rounded border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
                                    value={newEntryForm.slug}
                                    onChange={(e) =>
                                        setNewEntryForm((f) => ({ ...f, slug: e.target.value }))
                                    }
                                    className="min-h-[44px] w-full rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-base text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
                                    className="min-h-[44px] w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400"
                                    placeholder="Future feature"
                                    aria-describedby="parent-folder-hint"
                                />
                                <p id="parent-folder-hint" className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    Coming soon.
                                </p>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Content type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newEntryForm.contentTypeId}
                                    onChange={(e) =>
                                        setNewEntryForm((f) => ({
                                            ...f,
                                            contentTypeId: e.target.value,
                                        }))
                                    }
                                    className="min-h-[44px] w-full rounded border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
                                        No content types in this space. They are created automatically when you create a space.
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
                                <Link
                                    href={spaceId ? `/admin/entries?space=${spaceId}` : "/admin/entries"}
                                    className="min-h-[44px] rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-6 sm:px-6">
            <div className="mb-6">
                <Link
                    href={spaceId ? `/admin/entries?space=${spaceId}` : "/admin/entries"}
                    className="inline-block min-h-[44px] text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                    ← Entries
                </Link>
            </div>
            <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                <h1 className="mb-6 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    Edit entry
                </h1>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Name
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            className="min-h-[44px] w-full rounded border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
                            className="min-h-[44px] w-full rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-base text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            placeholder="e.g. about, blog/my-post"
                        />
                    </div>
                    {blocks.length > 0 && (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Add block from library
                            </label>
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                    value=""
                                    onChange={(e) => {
                                        const id = e.target.value;
                                        if (!id) return;
                                        const block = blocks.find((b) => b.id === id);
                                        if (block) addBlockToEntry(block);
                                        e.target.value = "";
                                    }}
                                    aria-label="Add block to entry"
                                >
                                    <option value="">Choose a block…</option>
                                    {blocks.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} ({b.type})
                                        </option>
                                    ))}
                                </select>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Inserts block into content.body
                                </span>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Content (JSON)
                        </label>
                        <textarea
                            value={form.content}
                            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                            rows={14}
                            className="min-h-[200px] w-full rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 sm:min-h-[320px]"
                            spellCheck={false}
                        />
                    </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={save}
                        disabled={saving}
                        className="min-h-[44px] rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                    {!isNew && entry && (
                        <button
                            type="button"
                            onClick={async () => {
                                await fetch(
                                    `/api/entries/${encodeURIComponent(entry.slug)}`,
                                    {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            isPublished: !entry.isPublished,
                                            ...(spaceId && { spaceId }),
                                        }),
                                    }
                                );
                                setEntry((e) => (e ? { ...e, isPublished: !e.isPublished } : null));
                            }}
                            className="min-h-[44px] rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            {entry.isPublished ? "Unpublish" : "Publish"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
