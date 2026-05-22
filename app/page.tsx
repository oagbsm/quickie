import BusinessCTA from "./homepagecomponents/BusinessCTA";
import Categories from "./homepagecomponents/Categories";
import Header from "./homepagecomponents/Header";
import Hero from "./homepagecomponents/Hero";
import HowItWorks from "./homepagecomponents/HowItWorks";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <Header />
      <Hero />
      <Categories />
      <HowItWorks />
      <div id="provider-waitlist" className="scroll-mt-[96px]">
        <BusinessCTA />
      </div>
      <Footer/>
    </main>
  );
}