import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const TOKEN_PREFIX = "blade_";
const TOKEN_BYTES = 24;

function hashToken(token: string): string {
    return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Generate a new secret and return { secret, hash, prefix } (show secret to user once) */
export function generateTokenSecret(): {
    secret: string;
    hash: string;
    prefix: string;
} {
    const secret = TOKEN_PREFIX + randomBytes(TOKEN_BYTES).toString("hex");
    return {
        secret,
        hash: hashToken(secret),
        prefix: secret.slice(0, 12) + "…",
    };
}

/** Get token from request: Authorization: Bearer <token> or X-API-Key: <token> */
export async function getTokenFromRequest(): Promise<string | null> {
    const h = await headers();
    const authHeader = h.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7).trim() || null;
    }
    const apiKey = h.get("x-api-key");
    return apiKey?.trim() || null;
}

export type TokenResult = { valid: true; spaceId: string | null } | { valid: false; error: string };

/**
 * Validate the token from the request. Returns spaceId if token is scoped to a space (null = use default).
 * Caller should update lastUsedAt in background.
 */
export async function validateAccessToken(token: string | null): Promise<TokenResult> {
    if (!token?.startsWith(TOKEN_PREFIX)) {
        return { valid: false, error: "Invalid or missing token" };
    }
    const hash = hashToken(token);
    const record = await prisma.accessToken.findUnique({
        where: { tokenHash: hash },
        include: { space: true },
    });
    if (!record) {
        return { valid: false, error: "Invalid or expired token" };
    }
    // Update lastUsedAt (fire and forget)
    prisma.accessToken
        .update({
            where: { id: record.id },
            data: { lastUsedAt: new Date() },
        })
        .catch(() => {});
    return {
        valid: true,
        spaceId: record.spaceId,
    };
}

/**
 * For content API: allow access if user has session (admin) or valid access token.
 * Returns { allowed: true, spaceId?, userId? } or { allowed: false, status, error }.
 * When session: spaceId is null, userId is our DB user id for resolving default space.
 */
export async function requireReadAccess(): Promise<
    | { allowed: true; spaceId: string | null; userId?: string }
    | { allowed: false; status: number; error: string }
> {
    const session = await auth();
    if (session?.user) {
        const dbUserId = (session.user as { dbUserId?: string }).dbUserId;
        return { allowed: true, spaceId: null, userId: dbUserId };
    }
    const token = await getTokenFromRequest();
    const result = await validateAccessToken(token);
    if (result.valid) {
        return { allowed: true, spaceId: result.spaceId };
    }
    return {
        allowed: false,
        status: 401,
        error: result.error ?? "Authentication required",
    };
}
