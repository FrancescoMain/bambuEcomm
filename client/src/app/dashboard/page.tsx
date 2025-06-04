"use client";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RootState } from "@/redux/store";

export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();

  useEffect(() => {
    console.log("DashboardPage useEffect", { user, isLoading, token });
    if (isLoading) return;
    if (!user && !token) {
      router.replace("/login");
    } else if (user && user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [user, isLoading, token, router]);

  if (isLoading || (token && !user)) {
    return <div>Loading...</div>;
  }
  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard Admin</h1>
      {/* Admin dashboard content here */}
    </div>
  );
}
