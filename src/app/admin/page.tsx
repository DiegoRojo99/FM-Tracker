'use client';

import { useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import Link from "next/link";

export default function AdminPage() {
  const { user, userLoading } = useAuth();
  
  useEffect(() => {
    const adminUID = process.env.NEXT_PUBLIC_ADMIN_UID;
    if (userLoading) return;
    if (!user || user.uid !== adminUID) {
      window.location.href = "/";
    }
  }, [user, userLoading]);

  return (
    <div className="flex flex-col items-center min-h-screen mx-8 p-6">
      <h1 className="text-2xl font-bold mb-8">Admin Page</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminBox title="Challenges" link="/admin/add-challenge" />
        <AdminBox title="Competitions" link="/admin/competitions" />
        <AdminBox title="Verify Competitions" link="/admin/verify-competitions" />
        <AdminBox title="Coords Picker" link="/admin/teams/coords-picker" />
        <AdminBox title="Leagues" link="/admin/leagues" />
        <AdminBox title="Teams" link="/admin/teams" />
        <AdminBox title="Stats" link="/admin/stats" />
      </div>
    </div>
  );
}

function AdminBox({ title, link }: { title: string; link: string; }) {
  return (
    <Link href={link} className="w-full h-full">
      <div className="bg-purple-500 p-4 rounded shadow">
        <h2 className="text-xl font-bold p-2 text-white text-center">{title}</h2>
      </div>
    </Link>
  );
}