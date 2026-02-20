"use client";

import { useState } from "react";

type Token = {
    id: string;
    name: string;
    tokenPrefix: string;
    spaceId: string | null;
    space: { id: string; name: string; identifier: string } | null;
    createdAt: string;
    lastUsedAt: string | null;
};

type Space = {
    id: string;
    name: string;
    identifier: string;
};

export function TokensClient({
    initialTokens,
    spaces,
    defaultSpaceId,
}: {
    initialTokens: Token[];
    spaces: Space[];
    defaultSpaceId?: string;
}) {
    const [tokens, setTokens] = useState(initialTokens);
    const [creating, setCreating] = useState(false);
    const [newToken, setNewToken] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formSpaceId, setFormSpaceId] = useState(defaultSpaceId ?? "");
    const [revoking, setRevoking] = useState<string | null>(null);

    const createToken = async () => {
        setCreating(true);
        setNewToken(null);
        try {
            const res = await fetch("/api/admin/tokens", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formName || "Unnamed token",
                    spaceId: formSpaceId || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to create token");
            setTokens((prev) => [
                {
                    id: data.id,
                    name: data.name,
                    tokenPrefix: data.tokenPrefix,
                    spaceId: data.spaceId,
                    space: data.space,
                    createdAt: data.createdAt,
                    lastUsedAt: null,
                },
                ...prev,
            ]);
            setNewToken(data.token);
            setFormName("");
            setFormSpaceId(defaultSpaceId ?? "");
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to create token");
        } finally {
            setCreating(false);
        }
    };

    const revokeToken = async (id: string) => {
        setRevoking(id);
        try {
            const res = await fetch(`/api/admin/tokens/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to revoke");
            setTokens((prev) => prev.filter((t) => t.id !== id));
            if (newToken) setNewToken(null);
        } catch (e) {
            alert(e instanceof Error ? e.message : "Failed to revoke");
        } finally {
            setRevoking(null);
        }
    };

    const copyToken = (token: string) => {
        navigator.clipboard.writeText(token);
        alert("Token copied to clipboard. Store it securely — it won’t be shown again.");
    };

    return (
        <div className="space-y-8">
            {/* Create token */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Create token
                </h2>
                <div className="mt-4 flex flex-wrap items-end gap-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Name
                        </span>
                        <input
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="e.g. Production website"
                            className="w-56 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                    </label>
                    {!defaultSpaceId && (
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Space
                            </span>
                            <select
                                value={formSpaceId}
                                onChange={(e) => setFormSpaceId(e.target.value)}
                                className="w-48 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            >
                                <option value="">Default (all)</option>
                                {spaces.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    <button
                        type="button"
                        onClick={createToken}
                        disabled={creating}
                        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                        {creating ? "Creating…" : "Create token"}
                    </button>
                </div>
                {newToken && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Copy your token now. It won’t be shown again.
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                            <code className="flex-1 truncate rounded bg-white/80 px-2 py-1 font-mono text-sm text-amber-900 dark:bg-zinc-900/80 dark:text-amber-100">
                                {newToken}
                            </code>
                            <button
                                type="button"
                                onClick={() => copyToken(newToken)}
                                className="shrink-0 rounded bg-amber-200 px-3 py-1 text-sm font-medium text-amber-900 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* List tokens */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Your tokens
                </h2>
                {tokens.length === 0 ? (
                    <p className="text-zinc-500 dark:text-zinc-400">
                        No tokens yet. Create one to connect a frontend.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {tokens.map((t) => (
                            <li
                                key={t.id}
                                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                            >
                                <div>
                                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                                        {t.name}
                                    </span>
                                    <span className="ml-2 font-mono text-sm text-zinc-500 dark:text-zinc-400">
                                        {t.tokenPrefix}
                                    </span>
                                    {t.space && (
                                        <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                                            {t.space.name}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                                    {t.lastUsedAt && (
                                        <span>
                                            Used {new Date(t.lastUsedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => revokeToken(t.id)}
                                        disabled={revoking === t.id}
                                        className="text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                                    >
                                        {revoking === t.id ? "Revoking…" : "Revoke"}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Usage */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    Using the token in your frontend
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Send the token in requests to the content API:
                </p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100 dark:bg-zinc-950">
                    {`// Header (recommended)
Authorization: Bearer YOUR_TOKEN

// Or
X-API-Key: YOUR_TOKEN

// Example: fetch entries
const res = await fetch("https://your-bolt.com/api/entries?published=true", {
  headers: { "Authorization": "Bearer " + token }
});`}
                </pre>
            </div>
        </div>
    );
}
