import Here from '@/components/main/here';
import Navbar from '@/components/main/navbar';
import Hero from '@/components/main/hero';

export default function Home() {
  return (
    <main className="relative w-full min-h-screen">
      <Here />
      <Navbar />
      <Hero />
    </main>
  );
}