'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { getUser, isAuthenticated } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    const user = getUser();
    if (user?.role !== 'admin') router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <AdminSidebar />
      <main className="flex-1 lg:ml-0 pt-14 lg:pt-0 overflow-auto" style={{ background: 'var(--bg)' }}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
