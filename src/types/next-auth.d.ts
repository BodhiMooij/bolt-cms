import type { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            /** Our database User id (for spaces/members) */
            dbUserId?: string;
        } & DefaultSession["user"];
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        dbUserId?: string;
    }
}
