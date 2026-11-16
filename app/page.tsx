import Ecossistema from "@/components/sections/ecossistema";
import Escritorios from "@/components/sections/escritorios";
import Footer from "@/components/sections/footer";
import Header from "@/components/sections/header";
import Hero from "@/components/sections/hero";
import Midia from "@/components/sections/midia";
import Numeros from "@/components/sections/numeros";
import Pilares from "@/components/sections/pilares";
import Risco from "@/components/sections/risco";

// Mesma ordem da LP atual no WP.
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Risco />
        <Escritorios />
        <Numeros />
        <Pilares />
        <Ecossistema />
        <Midia />
      </main>
      <Footer />
    </>
  );
}
