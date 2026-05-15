import BusinessCTA from "./homepagecomponents/BusinessCTA";
import Header from "./homepagecomponents/Header";
import Hero from "./homepagecomponents/Hero";
import TrustBar from "./homepagecomponents/TrustBar";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <Header />
      <Hero />
      <div className="hidden sm:block">
        <TrustBar />
      </div>
      <BusinessCTA />
      <Footer />
    </main>
  );
}