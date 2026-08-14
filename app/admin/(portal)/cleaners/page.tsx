import { redirect } from "next/navigation";

export default function CleanersRedirect() {
  redirect("/admin/providers");
}
