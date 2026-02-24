import "dotenv/config";
import { prisma } from "../src/lib/db";

const SEED_USER_EMAIL = process.env.SEED_USER_EMAIL ?? "seed@example.com";

async function main() {
    const user = await prisma.user.upsert({
        where: { email: SEED_USER_EMAIL },
        update: {},
        create: {
            email: SEED_USER_EMAIL,
            name: "Seed User",
        },
    });

    const space = await prisma.space.upsert({
        where: { userId_identifier: { userId: user.id, identifier: "default" } },
        update: {},
        create: {
            userId: user.id,
            name: "Default Space",
            identifier: "default",
        },
    });

    await prisma.component.upsert({
        where: {
            spaceId_type: { spaceId: space.id, type: "hero" },
        },
        update: {},
        create: {
            spaceId: space.id,
            name: "Hero",
            type: "hero",
            isRoot: false,
            isNestable: true,
            schema: JSON.stringify({
                type: "hero",
                fields: [
                    { name: "headline", type: "text", required: true },
                    { name: "subheadline", type: "textarea" },
                    { name: "image", type: "asset" },
                    { name: "cta_text", type: "text" },
                    { name: "cta_link", type: "link" },
                ],
            }),
        },
    });

    await prisma.component.upsert({
        where: {
            spaceId_type: { spaceId: space.id, type: "text" },
        },
        update: {},
        create: {
            spaceId: space.id,
            name: "Text",
            type: "text",
            isRoot: false,
            isNestable: true,
            schema: JSON.stringify({
                type: "text",
                fields: [{ name: "content", type: "richtext", required: true }],
            }),
        },
    });

    await prisma.component.upsert({
        where: {
            spaceId_type: { spaceId: space.id, type: "image" },
        },
        update: {},
        create: {
            spaceId: space.id,
            name: "Image",
            type: "image",
            isRoot: false,
            isNestable: true,
            schema: JSON.stringify({
                type: "image",
                fields: [
                    { name: "image", type: "asset", required: true },
                    { name: "caption", type: "text" },
                    { name: "alt", type: "text" },
                ],
            }),
        },
    });

    const pageType = await prisma.contentType.upsert({
        where: {
            spaceId_type: { spaceId: space.id, type: "page" },
        },
        update: {},
        create: {
            spaceId: space.id,
            name: "Page",
            type: "page",
            schema: JSON.stringify({
                allowedBlocks: ["hero", "text", "image"],
                fields: [
                    { name: "title", type: "text", required: true },
                    { name: "meta_description", type: "textarea" },
                ],
            }),
        },
    });

    await prisma.entry.upsert({
        where: { spaceId_slug: { spaceId: space.id, slug: "home" } },
        update: {},
        create: {
            spaceId: space.id,
            contentTypeId: pageType.id,
            slug: "home",
            name: "Home",
            isPublished: true,
            publishedAt: new Date(),
            content: JSON.stringify({
                title: "Welcome",
                meta_description: "Blade by Revicx – Edit your content here.",
                body: [
                    {
                        type: "hero",
                        headline: "Welcome to Blade",
                        subheadline: "A Storyblok-like headless CMS. Edit content in the admin.",
                        cta_text: "Go to Admin",
                        cta_link: "/admin",
                    },
                    {
                        type: "text",
                        content: "<p>Add more blocks in the admin to build your page.</p>",
                    },
                ],
            }),
        },
    });

    console.log(
        "Seed complete: user, default space, components (hero, text, image), page content type, and home entry. Sign in with GitHub to get your own account; use SEED_USER_EMAIL to create a space for a specific email."
    );
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
