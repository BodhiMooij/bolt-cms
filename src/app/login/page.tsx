import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { BoltLogo } from "@/components/bolt-logo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 md:flex-row">
      {/* Left: Login */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 md:px-16 md:py-16 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <BoltLogo className="h-5 w-5 text-[#FF9800]" />
              Bolt
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Welcome back
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Sign in to manage your content and publish to your site.
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/admin" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-zinc-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-zinc-900/25 transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:shadow-zinc-950/50 dark:hover:bg-zinc-200 dark:focus:ring-zinc-50 dark:focus:ring-offset-zinc-950"
            >
              <GitHubIcon className="h-5 w-5" />
              Sign in with GitHub
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            By signing in, you can create and edit entries, manage components, and control publishing.
          </p>
        </div>
      </div>

      {/* Right: Features */}
      <div className="flex flex-1 flex-col m-4 rounded-sm justify-center border border-zinc-200 bg-white px-8 py-12 dark:border-zinc-800 dark:bg-zinc-900/50 md:px-16 md:py-16 lg:px-24">
        <div className="mx-auto w-full max-w-md">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            What you get
          </h2>
          <ul className="mt-6 space-y-6">
            <FeatureItem
              icon={<BlocksIcon />}
              title="Component-based content"
              description="Build pages from reusable blocks—heroes, text, images—with full control over structure and schema."
            />
            <FeatureItem
              icon={<ApiIcon />}
              title="Headless REST API"
              description="Fetch content via a simple API. Use it with any frontend, static site, or app."
            />
            <FeatureItem
              icon={<PublishIcon />}
              title="Draft & publish"
              description="Edit in draft, then publish when ready. Your live site updates on your schedule."
            />
            <FeatureItem
              icon={<PaletteIcon />}
              title="Dark mode"
              description="Admin and site follow your system preference for light or dark mode."
            />
          </ul>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
        {icon}
      </span>
      <div>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </li>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function BlocksIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ApiIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  );
}

function PublishIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="1" />
      <circle cx="17.5" cy="10.5" r="1" />
      <circle cx="8.5" cy="7.5" r="1" />
      <circle cx="6.5" cy="12.5" r="1" />
      <path d="M12 2a10 10 0 1 0 10 10c0-1.5-.5-2.5-1.25-3.5a1.5 1.5 0 0 0-1.2-.5H14a1.5 1.5 0 0 0-1.5 1.5v-.5c0-.8-.7-1.5-1.5-1.5H12" />
    </svg>
  );
}
