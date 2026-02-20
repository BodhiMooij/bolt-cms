import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

async function getHomeEntry() {
  const space = await prisma.space.findFirst({
    where: { identifier: "default" },
  });
  if (!space) return null;
  const entry = await prisma.entry.findFirst({
    where: { spaceId: space.id, slug: "home", isPublished: true },
  });
  return entry;
}

export async function generateMetadata(): Promise<Metadata> {
  const entry = await getHomeEntry();
  const content = entry?.content
    ? typeof entry.content === "string"
      ? JSON.parse(entry.content)
      : entry.content
    : null;
  const title = content?.title ?? "Home";
  return { title };
}

function HeroBlock({
  headline,
  subheadline,
  cta_text,
  cta_link,
}: {
  headline?: string;
  subheadline?: string;
  cta_text?: string;
  cta_link?: string;
}) {
  return (
    <section className="border-b border-zinc-200 bg-zinc-50 px-6 py-16 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-2xl text-center">
        {headline && (
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {headline}
          </h1>
        )}
        {subheadline && (
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            {subheadline}
          </p>
        )}
        {cta_text && (
          <Link
            href={cta_link ?? "#"}
            className="mt-6 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {cta_text}
          </Link>
        )}
      </div>
    </section>
  );
}

function TextBlock({ content }: { content?: string }) {
  if (!content) return null;
  return (
    <section className="px-6 py-10">
      <div
        className="prose prose-zinc mx-auto max-w-2xl dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
}

function ImageBlock({
  image,
  caption,
  alt,
}: {
  image?: { url?: string };
  caption?: string;
  alt?: string;
}) {
  if (!image?.url) return null;
  return (
    <figure className="px-6 py-6">
      <div className="mx-auto max-w-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={alt ?? caption ?? ""}
          className="w-full rounded-lg object-cover"
        />
        {caption && (
          <figcaption className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {caption}
          </figcaption>
        )}
      </div>
    </figure>
  );
}

export default async function SitePage() {
  const entry = await getHomeEntry();
  const content = entry
    ? (typeof entry.content === "string"
        ? JSON.parse(entry.content)
        : entry.content)
    : null;
  const body = (content?.body as Array<{ type: string; [k: string]: unknown }>) ?? [];
  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {body.length === 0 && !content && (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
          <h1 className="text-2xl font-bold dark:text-zinc-50">Bolt</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            No published home page. Run{" "}
            <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm dark:bg-zinc-800 dark:text-zinc-300">
              npm run db:seed
            </code>{" "}
            then edit content at{" "}
            <Link
              href="/admin"
              className="font-medium text-zinc-900 underline dark:text-zinc-100"
            >
              /admin
            </Link>
            .
          </p>
        </div>
      )}
      {body.map((block, i) => {
        if (block.type === "hero") {
          return (
            <HeroBlock
              key={i}
              headline={block.headline as string}
              subheadline={block.subheadline as string}
              cta_text={block.cta_text as string}
              cta_link={block.cta_link as string}
            />
          );
        }
        if (block.type === "text") {
          return <TextBlock key={i} content={block.content as string} />;
        }
        if (block.type === "image") {
          return (
            <ImageBlock
              key={i}
              image={block.image as { url?: string }}
              caption={block.caption as string}
              alt={block.alt as string}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
