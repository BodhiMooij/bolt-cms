import "dotenv/config";
import { Client } from "pg";
import { execSync } from "child_process";

async function main() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("DATABASE_URL is not set.");
        process.exit(1);
    }
    const hasSsl = /[?&]sslmode=/.test(url);
    const urlWithSsl = hasSsl ? url : `${url}${url.includes("?") ? "&" : "?"}sslmode=no-verify`;

    const sql = execSync(
        "npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script",
        { encoding: "utf-8", env: { ...process.env } }
    ).replace(/^Loaded Prisma config.*\n/, "");

    const client = new Client({ connectionString: urlWithSsl });
    await client.connect();
    try {
        await client.query(sql);
        console.log("Schema applied successfully.");
    } finally {
        await client.end();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
