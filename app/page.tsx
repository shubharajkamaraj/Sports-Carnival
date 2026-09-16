import Navbar from "@/components/common/Navbar";
import Hero from "@/components/viewer/Hero";
import FeaturedGames from "@/components/viewer/FeaturedGames";
import Statistics from "@/components/viewer/Statistics";
import UpcomingMatches from "@/components/viewer/UpcomingMatches";
import Leaderboard from "@/components/viewer/Leaderboard";
import GalleryPreview from "@/components/viewer/GalleryPreview";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <FeaturedGames />
      <Statistics />
      <UpcomingMatches />
      <Leaderboard />
      <GalleryPreview />
    </>
  );
}