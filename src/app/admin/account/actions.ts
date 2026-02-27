"use server";

import { getSessionUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

const ALLOWED_ROLES = ["developer", "marketeer", "content_creator", "website_owner"] as const;

export async function updateRoleAction(formData: FormData): Promise<void> {
    const user = await getSessionUser();
    if (!user) return;

    const role = formData.get("role");
    if (role === null || role === "") {
        await prisma.user.update({
            where: { id: user.id },
            data: { role: null },
        });
        revalidatePath("/admin/account");
        return;
    }
    if (typeof role !== "string" || !ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
        return;
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { role },
    });
    revalidatePath("/admin/account");
}
