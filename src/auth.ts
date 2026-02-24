import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
            allowDangerousEmailAccountLinking: false,
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth: session, request }) {
            const path = request.nextUrl.pathname;
            const isAdmin = path.startsWith("/admin");
            if (isAdmin) return !!session?.user;
            return true;
        },
        async signIn({ user }) {
            if (!user?.email) return true;
            try {
                await prisma.user.upsert({
                    where: { email: user.email },
                    create: {
                        email: user.email,
                        name: user.name ?? null,
                        image: user.image ?? null,
                    },
                    update: {
                        name: user.name ?? undefined,
                        image: user.image ?? undefined,
                    },
                });
            } catch {
                // allow sign-in even if upsert fails (e.g. DB issue)
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user?.email) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { email: user.email },
                        select: { id: true },
                    });
                    if (dbUser) token.dbUserId = dbUser.id;
                } catch {
                    // keep existing token.dbUserId if any
                }
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                (session.user as { dbUserId?: string }).dbUserId = token.dbUserId;
            }
            return session;
        },
    },
    trustHost: true,
});
