import { fetchAllStudents } from "@/services/sheetsService";
import HomeClient from "@/components/HomeClient";

export const revalidate = 60;

export default async function HomePage() {
  const students = await fetchAllStudents();
  return <HomeClient students={students} />;
}
