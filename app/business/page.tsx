import { redirect } from "next/navigation";

export default function Page() {
  redirect("/auth/portal?next=%2Fbusiness%2Fdashboard");
}
