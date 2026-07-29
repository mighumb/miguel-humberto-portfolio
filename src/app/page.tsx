import AmbientBackground from "@/components/AmbientBackground";
import AmbientForeground from "@/components/AmbientForeground";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Manifesto from "@/components/Manifesto";
import Contact from "@/components/Contact";
import StickyHeader from "@/components/StickyHeader";

export default function Home() {
  return (
    <main>
      <StickyHeader />
      <AmbientBackground />
      <div className="relative z-[1]">
        <Hero />
        <Projects />
      </div>
      <Manifesto />
      <Contact />
      <AmbientForeground />
    </main>
  );
}
