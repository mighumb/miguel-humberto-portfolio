import AmbientBackground from "@/components/AmbientBackground";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Manifesto from "@/components/Manifesto";
import Showreel from "@/components/Showreel";
import Contact from "@/components/Contact";
import StickyHeader from "@/components/StickyHeader";
import ScrollToTopButton from "@/components/ScrollToTopButton";

export default function Home() {
  return (
    <main>
      <StickyHeader />
      <ScrollToTopButton />
      <AmbientBackground />
      {/* Above the later sections so the manifesto's upward fade band, which
          reaches 12rem over the carousel, stays behind the cards. */}
      <div className="relative z-[3] pt-[3svh] md:pt-0">
        <Hero />
        <Projects />
      </div>
      <Manifesto />
      <Showreel />
      <Contact />
    </main>
  );
}
