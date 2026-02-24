import { prisma } from "@/lib/db";

/** Create default components (hero, text, image) and "page" content type for a space so entries can be created. */
export async function ensureSpaceHasContentTypes(spaceId: string): Promise<void> {
    const space = await prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) return;

    await prisma.component.upsert({
        where: { spaceId_type: { spaceId, type: "hero" } },
        update: {},
        create: {
            spaceId,
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
        where: { spaceId_type: { spaceId, type: "text" } },
        update: {},
        create: {
            spaceId,
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
        where: { spaceId_type: { spaceId, type: "image" } },
        update: {},
        create: {
            spaceId,
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
    await prisma.contentType.upsert({
        where: { spaceId_type: { spaceId, type: "page" } },
        update: {},
        create: {
            spaceId,
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
}
