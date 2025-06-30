'use client';

import { useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import Link from "next/link";

export default function AdminPage() {
  const { user, userLoading } = useAuth();
  const adminUID = process.env.NEXT_PUBLIC_ADMIN_UID;
  
  useEffect(() => {
    if (userLoading) return;
    if (!user || user.uid !== adminUID) {
      window.location.href = "/";
    }
  }, [user, userLoading]);

  return (
    <div>
      <h1>Admin Page</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminBox title="Challenges" link="/admin/add-challenge" />
        <AdminBox title="Verify Competitions" link="/admin/verify-competitions" />
        <AdminBox title="Team Coords" link="/admin/team-coords" />
      </div>
    </div>
  );
}

function AdminBox({ title, link }: { title: string; link: string; }) {
  return (
    <Link href={link} className="block">
      <div className="bg-purple-500 p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
      </div>
    </Link>
  );
}