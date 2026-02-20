# Bolt

Component-based content CMS, admin UI with GitHub login, and a REST API so you can connect multiple frontends. Built with Next.js, Prisma, and Tailwind.

## What’s included

- **Spaces** – Workspaces (e.g. default, marketing). Each has its own entries, components, and content types.
- **Content types** – e.g. “Page”, “Article”, with configurable schemas and allowed blocks.
- **Components** – Reusable blocks (Hero, Text, Image, etc.) with JSON schemas. Seed includes hero, text, image.
- **Entries** – Content items with slug, name, draft/publish, and a JSON body (title, meta, body blocks).
- **Admin UI** – Left sidebar (logo, My spaces, View site, logout). Overview of spaces, entries list, entry editor (JSON), access token management.
- **GitHub login** – NextAuth.js v5. Admin routes require sign-in; homepage redirects to login or admin.
- **Access tokens** – Create named tokens in admin (optionally scoped to a space). Use in `Authorization: Bearer <token>` or `X-API-Key` so external frontends can read content. Tokens are read-only; write (create/update/delete) requires admin session.
- **Dark mode** – Follows system preference (light or dark) only; no manual toggle.
- **HTTPS in dev** – `npm run dev` serves over **https://localhost:3000** with a self-signed certificate.
- **Public site** – Preview at `/site` (renders the “home” entry). “View site” in the sidebar opens this.

## Routes

| Path                    | Description                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `/`                     | Redirects to `/login` (signed out) or `/admin` (signed in).                                        |
| `/login`                | Sign-in page (split layout: login on the left, feature list on the right). GitHub only.            |
| `/admin`                | My spaces overview – cards for each space (name, identifier, entry/component/content type counts). |
| `/admin/entries`        | List of entries (default space, or `?space=<id>` from a space card).                               |
| `/admin/entries/new`    | Create a new entry.                                                                                |
| `/admin/entries/[slug]` | Edit entry (name, slug, raw JSON content). Save, Publish/Unpublish.                                |
| `/admin/tokens`         | Create, list, and revoke access tokens for the content API.                                        |
| `/site`                 | Public preview – renders the published “home” entry (hero, text, image blocks).                    |

## Setup

1. **Install dependencies**

    ```bash
    npm install
    ```

2. **Environment**

    ```bash
    cp .env.example .env
    ```

    Configure:
    - `DATABASE_URL` – **Supabase (PostgreSQL):** In [Supabase](https://supabase.com) go to Project Settings → Database and copy the **Connection string** (URI). Use the **Transaction** pooler URL (port 6543) for Prisma; add `?sslmode=require` if your client requires it. Paste into `.env` as `DATABASE_URL`.
    - **GitHub OAuth** (admin login): create a [GitHub OAuth App](https://github.com/settings/developers) with Authorization callback URL `https://localhost:3000/api/auth/callback/github`. Set `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` in `.env`.
    - `AUTH_SECRET` – required; e.g. `openssl rand -base64 32`
    - `AUTH_URL` – set to `https://localhost:3000` when using `npm run dev` (HTTPS) so OAuth redirects work.

3. **Database**

    With `DATABASE_URL` set to your Supabase (or any PostgreSQL) URL:

    ```bash
    npm run db:push
    npm run db:seed
    ```

    This applies the schema to your database and seeds the default space, Hero/Text/Image components, “page” content type, and a published “home” entry.

4. **Run the app**

    ```bash
    npm run dev
    ```

    Opens at **https://localhost:3000**. Accept the self-signed certificate warning once, then use the URLs above.

## Scripts

| Command             | Description                                     |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Dev server with HTTPS at https://localhost:3000 |
| `npm run build`     | Production build                                |
| `npm run start`     | Production server (after `build`)               |
| `npm run db:push`   | Sync Prisma schema to the database              |
| `npm run db:seed`   | Seed default space and home content             |
| `npm run db:studio` | Open Prisma Studio                              |

## Content API

- **Read** (entries, components, spaces): allowed with an **admin session** (cookie) or a valid **access token** (header).
- **Write** (create/update/delete entries): **admin session only**; tokens are read-only.

**Headers for token auth:**

- `Authorization: Bearer YOUR_TOKEN`
- or `X-API-Key: YOUR_TOKEN`

**Endpoints:**

| Method | Endpoint              | Description                                                                     |
| ------ | --------------------- | ------------------------------------------------------------------------------- |
| GET    | `/api/entries`        | List entries. `?published=true`, `?space=<id>`. Token can be scoped to a space. |
| GET    | `/api/entries/[slug]` | Get one entry (parsed `content`).                                               |
| POST   | `/api/entries`        | Create entry (admin). Body: `{ name, slug, content, contentTypeId? }`.          |
| PUT    | `/api/entries/[slug]` | Update entry (admin). Body: `{ name?, slug?, content?, isPublished? }`.         |
| DELETE | `/api/entries/[slug]` | Delete entry (admin).                                                           |
| GET    | `/api/components`     | List components for the (default or token-scoped) space.                        |
| GET    | `/api/spaces`         | List all spaces.                                                                |

**Connecting a frontend:** Create a token under Admin → Access tokens, then call the API from any app (Next.js, React, Astro, etc.) with the token in the header.

## Stack

- **Next.js 16** (App Router)
- **NextAuth.js v5** (GitHub OAuth, custom login page)
- **Prisma 7** + PostgreSQL (`@prisma/adapter-pg`), e.g. [Supabase](https://supabase.com)
- **Tailwind CSS 4** (class-based dark variant)

## Possible next steps

- Visual block editor (drag-and-drop components instead of raw JSON).
- Asset upload and image picker.
- More component and field types (richtext, link, etc.).
- Multiple spaces in the seed or a “New space” flow in admin.
