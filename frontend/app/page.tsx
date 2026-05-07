'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const user = getUser();
    if (user?.role === 'admin') router.replace('/admin/dashboard');
    else if (user?.role === 'client') router.replace('/client/dashboard');
    else router.replace('/login');
  }, [router]);
  return null;
}
