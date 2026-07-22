import type { Metadata } from "next";
import SolutionPage from "@/app/components/public/SolutionPage";
export const metadata: Metadata = {
  title: "Managed office and commercial cleaning in Slough | Quickola",
  description:
    "Coordinate regular cleaning, site instructions and booking history for offices and commercial premises in Slough.",
  alternates: { canonical: "/solutions/offices" },
};
export default function Page() {
  return (
    <SolutionPage
      eyebrow="Offices & commercial properties"
      title="Keep routine workplace cleaning on a clear schedule."
      intro="Store site instructions, request recurring cleans and follow each booking while Quickola coordinates the cleaner."
      sectionTitle="Cleaning that works around your premises."
      sectionIntro="Keep access windows, communal-area priorities and operating hours with the site so routine cleaning is easier to coordinate."
      uses={[
        "Recurring cleaning schedules",
        "Fixed site and access instructions",
        "Cleaning around operating hours",
        "Communal-area requirements",
        "Booking progress across locations",
      ]}
      capabilities={[
        [
          "Site records",
          "Keep entry details, operating hours and cleaning priorities with each workplace.",
        ],
        [
          "Recurring schedules",
          "Share the frequency and access window that suits how the premises operates.",
        ],
        [
          "Managed assignment",
          "Quickola coordinates cleaner assignment and the operational handover.",
        ],
        [
          "Multi-site visibility",
          "Follow current and completed bookings for each saved office location.",
        ],
      ]}
      scheduleTitle="A routine shaped around your working day."
      schedule="Tell us when the site is accessible and which areas need attention. We review the practical requirements before agreeing a recurring arrangement."
    />
  );
}
