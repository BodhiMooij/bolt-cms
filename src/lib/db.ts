import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error(
        "DATABASE_URL is required. Set it to your Supabase (PostgreSQL) connection string."
    );
}
// Supabase (and most cloud Postgres) require SSL; pg driver does not enable it by default.
// Use no-verify so Supabase pooler's certificate is accepted (optional: use verify-full + sslrootcert for production).
const hasSsl = /[?&]sslmode=/.test(connectionString);
const connectionStringWithSsl = hasSsl
    ? connectionString
    : `${connectionString}${connectionString.includes("?") ? "&" : "?"}sslmode=no-verify`;
const adapter = new PrismaPg({ connectionString: connectionStringWithSsl });
const client = new PrismaClient({ adapter });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? client;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
