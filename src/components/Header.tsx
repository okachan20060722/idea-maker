'use client';

import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, loading, supabase } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="flex items-center justify-between p-4 bg-gray-900 text-white shadow-md">
      <Link href="/" className="text-xl font-bold">
        Idea Maker
      </Link>
      
      <nav>
        {!loading && (
          <ul className="flex space-x-6 items-center">
            {user ? (
              <>
                <li>
                  <Link href="/mypage" className="hover:text-gray-300">
                    マイページ
                  </Link>
                </li>
                <li>
                  <Link href="/favorites" className="hover:text-gray-300">
                    お気に入り
                  </Link>
                </li>
                <li>
                  <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition">
                    ログアウト
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link href="/login" className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition">
                  ログイン
                </Link>
              </li>
            )}
          </ul>
        )}
      </nav>
    </header>
  );
}
