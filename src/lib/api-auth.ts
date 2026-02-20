import { auth } from "@/auth";

/** Require admin session for write operations. Returns 401 if not logged in. */
export async function requireSession(): Promise<
    { ok: true } | { ok: false; status: number; error: string }
> {
    const session = await auth();
    if (session?.user) return { ok: true };
    return {
        ok: false,
        status: 401,
        error: "Authentication required. Use the admin to create or edit content.",
    };
}
