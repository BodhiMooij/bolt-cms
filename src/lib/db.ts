import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getConnectionString(): string {
    const raw = process.env.DATABASE_URL ?? "";
    // Strip newlines, carriage returns, and surrounding quotes (common when pasting in host dashboards)
    const connectionString = raw
        .replace(/[\r\n]/g, "")
        .trim()
        .replace(/^["']|["']$/g, "");
    if (!connectionString) {
        throw new Error(
            "DATABASE_URL is required. Set it in your host's environment variables (e.g. Vercel → Settings → Environment Variables)."
        );
    }
    if (!/^postgres(ql)?:\/\//i.test(connectionString)) {
        throw new Error(
            `DATABASE_URL must start with postgresql:// or postgres://. Got: ${connectionString.slice(0, 20)}... (set DATABASE_URL in your host's env vars).`
        );
    }
    // Fail fast with a clear error if the URL is unparseable (e.g. triggers "Invalid URL" on live)
    try {
        new URL(connectionString);
    } catch {
        throw new Error(
            "DATABASE_URL is invalid (Invalid URL). In your host's env vars use the Supabase Transaction pooler URL, no extra quotes or newlines. If the DB password has special chars (@ # % etc.), URL-encode them (e.g. @ → %40)."
        );
    }
    return connectionString;
}

const connectionString = getConnectionString();
// Supabase (and most cloud Postgres) require SSL; pg driver does not enable it by default.
const hasSsl = /[?&]sslmode=/.test(connectionString);
const connectionStringWithSsl = hasSsl
    ? connectionString
    : `${connectionString}${connectionString.includes("?") ? "&" : "?"}sslmode=no-verify`;

let adapter: PrismaPg;
try {
    adapter = new PrismaPg({ connectionString: connectionStringWithSsl });
} catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/invalid url|Invalid URL|connection string/i.test(msg)) {
        throw new Error(
            "DATABASE_URL is invalid. Check your host's environment variables: use the Supabase Transaction pooler URL (port 6543), no extra quotes or newlines, and URL-encode special characters in the password (e.g. @ → %40)."
        );
    }
    throw e;
}
const client = new PrismaClient({ adapter });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? client;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
