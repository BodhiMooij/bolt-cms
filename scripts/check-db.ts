import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
    try {
        await prisma.$queryRaw`SELECT 1 as ok`;
        console.log("✓ Database connection OK");
        try {
            const count = await prisma.space.count();
            console.log(`  Spaces in DB: ${count}`);
        } catch {
            console.log("  Schema not applied yet. Run: npm run db:push && npm run db:seed");
        }
    } catch (e) {
        console.error("✗ Database connection failed:", e instanceof Error ? e.message : e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
