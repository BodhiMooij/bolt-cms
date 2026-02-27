import "dotenv/config";
import { Client } from "pg";

function getConnectionString(): string {
    const raw = process.env.DATABASE_URL ?? "";
    const connectionString = raw
        .replace(/[\r\n]/g, "")
        .trim()
        .replace(/^["']|["']$/g, "");
    if (!connectionString) {
        throw new Error("DATABASE_URL is not set.");
    }
    const hasSsl = /[?&]sslmode=/.test(connectionString);
    return hasSsl
        ? connectionString
        : `${connectionString}${connectionString.includes("?") ? "&" : "?"}sslmode=no-verify`;
}

/** Create SpaceMember table if missing (avoids slow prisma migrate diff introspect). */
async function ensureSpaceMemberTable(client: Client): Promise<boolean> {
    const exists = await client.query(`
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SpaceMember'
    `);
    if (exists.rows.length > 0) return false;
    console.log("Creating SpaceMember table...");
    await client.query(`
        CREATE TABLE "SpaceMember" (
            "id" TEXT NOT NULL,
            "spaceId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "role" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "SpaceMember_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "SpaceMember_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "SpaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "SpaceMember_spaceId_userId_key" UNIQUE ("spaceId", "userId")
        );
    `);
    console.log("SpaceMember table created.");
    return true;
}

/** Create SpaceFavorite table if missing. */
async function ensureSpaceFavoriteTable(client: Client): Promise<boolean> {
    const exists = await client.query(`
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SpaceFavorite'
    `);
    if (exists.rows.length > 0) return false;
    console.log("Creating SpaceFavorite table...");
    await client.query(`
        CREATE TABLE "SpaceFavorite" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "spaceId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "SpaceFavorite_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "SpaceFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "SpaceFavorite_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "SpaceFavorite_userId_spaceId_key" UNIQUE ("userId", "spaceId")
        );
    `);
    console.log("SpaceFavorite table created.");
    return true;
}

/** Add User.role column if missing. */
async function ensureUserRoleColumn(client: Client): Promise<boolean> {
    const exists = await client.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'role'
    `);
    if (exists.rows.length > 0) return false;
    console.log("Adding User.role column...");
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT;`);
    console.log("User.role column added.");
    return true;
}

/** Add Entry.position column if missing. */
async function ensureEntryPositionColumn(client: Client): Promise<boolean> {
    const exists = await client.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Entry' AND column_name = 'position'
    `);
    if (exists.rows.length > 0) return false;
    console.log("Adding Entry.position column...");
    await client.query(`ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "position" INTEGER NOT NULL DEFAULT 0;`);
    console.log("Entry.position column added.");
    return true;
}

/** Add Entry.createdById column if missing. */
async function ensureEntryCreatedByIdColumn(client: Client): Promise<boolean> {
    const exists = await client.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Entry' AND column_name = 'createdById'
    `);
    if (exists.rows.length > 0) return false;
    console.log("Adding Entry.createdById column...");
    await client.query(`ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "createdById" TEXT;`);
    await client.query(`
        DO $$ BEGIN
            ALTER TABLE "Entry" ADD CONSTRAINT "Entry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    `);
    console.log("Entry.createdById column added.");
    return true;
}

/** Backfill for existing DB: add User table, add userId to Space and backfill. */
async function backfillExistingDb(client: Client): Promise<boolean> {
    const hasUserId = await client.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Space' AND column_name = 'userId'
    `);
    if (hasUserId.rows.length > 0) return false;

    const hasSpace = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Space'`);
    if (hasSpace.rows.length === 0) return false;

    console.log("Existing DB detected (Space without userId). Running backfill...");

    await client.query(`
        CREATE TABLE IF NOT EXISTS "User" (
            "id" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "name" TEXT,
            "image" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "User_pkey" PRIMARY KEY ("id")
        );
    `);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`);

    await client.query(`ALTER TABLE "Space" ADD COLUMN IF NOT EXISTS "userId" TEXT;`);

    const seedEmail = process.env.SEED_USER_EMAIL ?? "seed@example.com";
    const userIdResult = await client.query(
        `INSERT INTO "User" ("id", "email", "name", "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, 'Seed User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT ("email") DO UPDATE SET "email" = EXCLUDED."email" RETURNING "id"`,
        [seedEmail]
    );
    const userId = userIdResult.rows[0]?.id;
    if (!userId) throw new Error("Failed to get or create seed user.");

    await client.query(`UPDATE "Space" SET "userId" = $1 WHERE "userId" IS NULL`, [userId]);
    await client.query(`ALTER TABLE "Space" ALTER COLUMN "userId" SET NOT NULL`);

    await client.query(`ALTER TABLE "Space" DROP CONSTRAINT IF EXISTS "Space_identifier_key";`);
    await client.query(`DROP INDEX IF EXISTS "Space_identifier_key";`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "Space_userId_identifier_key" ON "Space"("userId", "identifier");`);
    await client.query(`
        DO $$ BEGIN
            ALTER TABLE "Space" ADD CONSTRAINT "Space_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    `);

    console.log("Backfill done.");
    return true;
}

async function main() {
    const url = getConnectionString();

    const client = new Client({ connectionString: url, connectionTimeoutMillis: 15_000 });
    await client.connect();
    try {
        await backfillExistingDb(client);
        await ensureSpaceMemberTable(client);
        await ensureSpaceFavoriteTable(client);
        await ensureUserRoleColumn(client);
        await ensureEntryPositionColumn(client);
        await ensureEntryCreatedByIdColumn(client);
    } finally {
        await client.end();
    }
    console.log("Schema applied successfully.");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
