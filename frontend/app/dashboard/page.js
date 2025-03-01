import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import RealTimeMonitoring from "../../components/RealTimeMonitoring/RealTimeMonitoring";
import TrendGraphs from "../../components/TrendGraphs/TrendGraphs";
import ChildProfile from "../../components/ChildProfile/ChildProfile";
import ProtectedRoute from "../../components/ProtectedRoute/ProtectedRoute";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  console.log("Dashboard token check:", token);

  if (!token) {
    console.log("Redirecting to login...");
    redirect("/auth/login");
  }

  const res = await fetch("http://localhost:8000/users/me", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Failed to fetch user data");
    redirect("/auth/login");
  }

  const userProfile = await res.json();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-400 pt-16 p-4">
        <Navbar userProfile={userProfile} />
        <main className="max-w-7xl mx-auto pt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RealTimeMonitoring />
            <TrendGraphs />
            <ChildProfile userData={userProfile} />
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}