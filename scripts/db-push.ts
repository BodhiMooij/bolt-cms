import "dotenv/config";
import { execSync } from "child_process";

const url = process.env.DATABASE_URL;
if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
}
const hasSsl = /[?&]sslmode=/.test(url);
const urlWithSsl = hasSsl ? url : `${url}${url.includes("?") ? "&" : "?"}sslmode=no-verify`;
process.env.DATABASE_URL = urlWithSsl;
execSync("npx prisma db push", { stdio: "inherit", env: process.env });
