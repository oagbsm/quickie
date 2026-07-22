import type { Metadata } from "next";
import SolutionPage from "@/app/components/public/SolutionPage";
export const metadata: Metadata = {
  title: "Managed cleaning for Airbnb and serviced accommodation | Quickola",
  description:
    "Organise repeat turnaround cleans and track booking status for short-let properties in the Slough area.",
  alternates: { canonical: "/solutions/airbnb" },
};
export default function Page() {
  return (
    <SolutionPage
      eyebrow="Airbnb & serviced accommodation"
      title="Make repeat property turnarounds easier to coordinate."
      intro="Keep property instructions, access details and requested turnaround timing together while Quickola manages cleaner assignment."
      sectionTitle="Repeat bookings without repeating instructions."
      sectionIntro="Keep the details for each short-let property ready for the next guest changeover, without rebuilding the brief in a message thread."
      uses={[
        "Reusable property and access instructions",
        "Turnaround requests around guest changeovers",
        "Requested timing and arrival information",
        "Booking progress visibility",
        "Completed-clean history by property",
      ]}
      capabilities={[
        [
          "Property instructions",
          "Save access, parking and cleaning requirements against each accommodation.",
        ],
        [
          "Changeover timing",
          "Request a clean around the required guest departure and arrival window.",
        ],
        [
          "Managed assignment",
          "Quickola coordinates the cleaner as part of the managed service.",
        ],
        [
          "Booking progress",
          "Follow each request from review through confirmation and completion.",
        ],
      ]}
      scheduleTitle="Turnaround timing stays attached to the property."
      schedule="Share the requested window and property details once. Quickola reviews coverage and coordinates cleaner assignment for suitable Slough turnarounds."
    />
  );
}
