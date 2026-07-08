import AmbientBackground from "@/components/AmbientBackground";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Manifesto from "@/components/Manifesto";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main>
      <AmbientBackground />
      <div className="relative z-[1]">
        <Hero />
        <Projects />
      </div>
      <Manifesto />
      <Contact />
    </main>
  );
}
