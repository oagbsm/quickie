import type { Metadata } from "next";
import SolutionPage from "@/app/components/public/SolutionPage";
export const metadata: Metadata = {
  title:
    "Cleaning platform for letting agents and property managers | Quickola",
  description:
    "Coordinate move-in, move-out and recurring property work across Slough with your existing contractors and providers.",
  alternates: { canonical: "/solutions/letting-agents" },
};
export default function Page() {
  return (
    <SolutionPage
      eyebrow="Letting agents & property managers"
      title="Keep cleaning organised across every property."
      intro="Store property instructions, coordinate one-off or recurring work with your existing contractors and follow every job from one account."
      sectionTitle="One place for every property and clean."
      sectionIntro="Coordinate end-of-tenancy, turnaround and recurring work across a portfolio while keeping the right access details with each address."
      uses={[
        "Central property records",
        "End-of-tenancy and turnaround requests",
        "Reusable access and key instructions",
        "Booking status across multiple properties",
        "Completed-service history by property",
      ]}
      capabilities={[
        [
          "Portfolio records",
          "Keep each address, access method and cleaning requirement together.",
        ],
        [
          "Property changeovers",
          "Request end-of-tenancy, move-in or void-property cleaning against the right record.",
        ],
        [
          "Work assignment",
          "Assign work to the contractors or cleaners your team already uses and keep the next action visible.",
        ],
        [
          "Portfolio visibility",
          "See which bookings are under review, confirmed, assigned or completed.",
        ],
      ]}
      scheduleTitle="Repeat work without rebuilding the brief."
      schedule="Request individual changeovers or share the recurring pattern you need. Property instructions remain ready for the next suitable booking."
    />
  );
}
