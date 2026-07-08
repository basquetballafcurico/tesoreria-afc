'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    async function ir() {
      const { data: { session } } = await supabase.auth.getSession();
      router.push(session ? '/dashboard' : '/login');
    }
    ir();
  }, [router]);
  return null;
}
