import { redirect } from "next/navigation";

/** Compatibility route for bookmarks to the retired admin messages screen. */
export default function LegacyAdminMessagesPage() {
  redirect("/admin/support");
}
