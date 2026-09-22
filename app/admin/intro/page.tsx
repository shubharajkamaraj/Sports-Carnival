"use client";

import { useRouter } from "next/navigation";
import ViewerIntro from "@/components/viewer/ViewerIntro";

export default function AdminIntroPage() {
  const router = useRouter();

  const handleComplete = () => {
    router.replace("/admin/dashboard");
  };

  return (
    <main className="viewer-page">
      <ViewerIntro onComplete={handleComplete} />
    </main>
  );
}