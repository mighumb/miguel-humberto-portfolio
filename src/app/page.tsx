import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Manifesto from "@/components/Manifesto";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-14 md:pt-16">
        <Hero />
        <Projects />
        <Manifesto />
        <Contact />
      </main>
    </>
  );
}
