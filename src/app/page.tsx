import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Bolt",
};

export default async function HomePage() {
    const session = await auth();
    if (session?.user) {
        redirect("/admin");
    }
    redirect("/login");
}
