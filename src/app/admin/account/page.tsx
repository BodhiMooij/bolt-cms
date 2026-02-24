import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSessionUser } from "@/lib/api-auth";

export const metadata: Metadata = {
    title: "Account settings",
};

export default async function AdminAccountPage() {
    const user = await getSessionUser();
    if (!user) redirect("/login");
    const session = await auth();
    const { name, email, image } = session?.user ?? {};

    return (
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
            <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Account settings
            </h1>
            <p className="mb-8 text-zinc-600 dark:text-zinc-400">
                Manage your account and sign-in details.
            </p>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-6 flex items-center gap-4">
                    {image ? (
                        <img
                            src={image}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
                        />
                    ) : (
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-2xl font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                            {(name ?? email ?? "?")[0].toUpperCase()}
                        </span>
                    )}
                    <div className="min-w-0">
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            {name ?? "—"}
                        </p>
                        <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                            {email ?? user.email ?? "—"}
                        </p>
                    </div>
                </div>
                <dl className="space-y-4">
                    <div>
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            Name
                        </dt>
                        <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
                            {name ?? "—"}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            Email
                        </dt>
                        <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
                            {email ?? user.email ?? "—"}
                        </dd>
                    </div>
                </dl>
                <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
                    Sign-in is managed by your provider (e.g. GitHub). To change your name or
                    email, update your profile there.
                </p>
            </div>
        </div>
    );
}
