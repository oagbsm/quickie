import type { Metadata } from "next";
import SolutionPage from "@/app/components/public/SolutionPage";
export const metadata: Metadata = {
  title: "Airbnb turnover coordination for STR operators | Quickola",
  description:
    "Organise repeat turnaround cleans and track booking status for short-let properties in the Slough area.",
  alternates: { canonical: "/solutions/airbnb" },
};
export default function Page() {
  return (
    <SolutionPage
      eyebrow="Airbnb & serviced accommodation"
      title="Make repeat property turnarounds easier to coordinate."
      intro="Keep property instructions and turnaround timing together, then bring your existing cleaner into the workflow."
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
          "Cleaner assignment",
          "Invite your cleaner, assign the turnover and keep the next action clear.",
        ],
        [
          "Booking progress",
          "Follow each request from review through confirmation and completion.",
        ],
      ]}
      scheduleTitle="Turnaround timing stays attached to the property."
      schedule="Share the window and property details once. Your booking creates the clean, then your cleaner completes the checklist and evidence before the property is marked ready."
    />
  );
}
