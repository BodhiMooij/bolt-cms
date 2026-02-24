"use client";

import { useRouter, useParams } from "next/navigation";
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

export default function EditEntryPage() {
    const params = useParams();
    const router = useRouter();
    const slug = decodeURIComponent((params.slug as string) ?? "");
    const isNew = slug === "new";

    const [entry, setEntry] = useState<Entry | null>(null);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", slug: "", content: "" });

    useEffect(() => {
        if (isNew) {
            setForm({
                name: "Untitled",
                slug: "untitled",
                content: JSON.stringify({ title: "", meta_description: "", body: [] }, null, 2),
            });
            setLoading(false);
            return;
        }
        fetch(`/api/entries/${encodeURIComponent(slug)}`)
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
    }, [slug, isNew]);

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
            const body = isNew
                ? { name: form.name, slug: form.slug, content }
                : { name: form.name, slug: form.slug, content };
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
            if (isNew) router.replace(`/admin/entries/${encodeURIComponent(data.slug)}`);
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
                    href="/admin"
                    className="mt-4 inline-block text-zinc-900 underline dark:text-zinc-100"
                >
                    Back to entries
                </Link>
            </div>
        );
    }

    return (
        <div className="px-4 py-6 sm:px-6">
            <div className="mb-6">
                <Link
                    href="/admin/entries"
                    className="inline-block min-h-[44px] text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                    ← Entries
                </Link>
            </div>
            <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                <h1 className="mb-6 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {isNew ? "New entry" : "Edit entry"}
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
                                await fetch(`/api/entries/${encodeURIComponent(entry.slug)}`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ isPublished: !entry.isPublished }),
                                });
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
