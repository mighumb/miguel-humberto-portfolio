import AmbientBackground from "@/components/AmbientBackground";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Manifesto from "@/components/Manifesto";
import Showreel from "@/components/Showreel";
import Contact from "@/components/Contact";
import StickyHeader from "@/components/StickyHeader";

export default function Home() {
  return (
    <main>
      <StickyHeader />
      <AmbientBackground />
      {/* Above the later sections so the manifesto's upward fade band, which
          reaches 12rem over the carousel, stays behind the cards. */}
      <div className="relative z-[3]">
        <Hero />
        <Projects />
      </div>
      <Manifesto />
      <Showreel />
      <Contact />
    </main>
  );
}
