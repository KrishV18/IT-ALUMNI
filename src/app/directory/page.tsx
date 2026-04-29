import { fetchAllStudents } from "@/services/sheetsService";
import DirectoryClient from "@/components/DirectoryClient";
import { Suspense } from "react";
import SkeletonCard from "@/components/SkeletonCard";

export const revalidate = 60;

function DirectoryFallback() {
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
      {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export default async function DirectoryPage() {
  const students = await fetchAllStudents();
  return (
    <Suspense fallback={<DirectoryFallback />}>
      <DirectoryClient students={students} />
    </Suspense>
  );
}
