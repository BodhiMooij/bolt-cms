import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { TokensClient } from "./tokens-client";

export const metadata: Metadata = {
  title: "Access tokens",
};

async function getSpaces() {
  return prisma.space.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, identifier: true },
  });
}

export default async function AdminTokensPage() {
  const [tokens, spaces] = await Promise.all([
    prisma.accessToken.findMany({
      orderBy: { createdAt: "desc" },
      include: { space: { select: { id: true, name: true, identifier: true } } },
    }),
    getSpaces(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Access tokens
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create tokens for frontends and apps to read content from the API. The token is shown only once when created.
        </p>
      </div>

      <TokensClient
        initialTokens={tokens.map((t) => ({
          id: t.id,
          name: t.name,
          tokenPrefix: t.tokenPrefix,
          spaceId: t.spaceId,
          space: t.space,
          createdAt: t.createdAt.toISOString(),
          lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
        }))}
        spaces={spaces}
      />
    </div>
  );
}
