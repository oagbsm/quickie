import type { Metadata } from "next";
import SolutionPage from "@/app/components/public/SolutionPage";
export const metadata: Metadata = {
  title: "Short-stay cleaning help | Quickola",
  description:
    "Post short-stay cleaning jobs and compare offers from independent local providers.",
  alternates: { canonical: "/solutions/airbnb" },
};
export default function Page() {
  return (
    <SolutionPage
      eyebrow="Short-stay cleaning"
      title="Find help between guest stays."
      intro="Post the cleaning job, share the timing and compare offers from independent providers."
      sectionTitle="Clear details for every cleaning job."
      sectionIntro="Share the property type, timing and requirements once so providers can understand the work before making an offer."
      uses={[
        "Clear job and access details",
        "Timing around guest changeovers",
        "Offers from local providers",
        "Message before choosing",
        "Booking progress visibility",
      ]}
      capabilities={[
        [
          "Job details",
          "Share access, parking and cleaning requirements with providers considering the job.",
        ],
        [
          "Changeover timing",
          "Add the required departure and arrival window to your job post.",
        ],
        [
          "Provider choice",
          "Compare independent providers, ask questions and choose the offer that suits you.",
        ],
        [
          "Booking progress",
          "Follow the job from offer review through booking and completion where supported.",
        ],
      ]}
      scheduleTitle="Timing stays attached to the job."
      schedule="Share the window and details once. Providers can respond with their availability, and you can message before booking."
    />
  );
}
