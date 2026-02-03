import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
    const user = await currentUser();

    // Security check - only allow admin users
    const isAdmin =
        user?.username === "admin" ||
        user?.emailAddresses?.some(email => email.emailAddress.includes("admin")) ||
        user?.publicMetadata?.role === "admin";

    if (!user || !isAdmin) {
        redirect("/");
    }

    return <AdminDashboard />;
}
