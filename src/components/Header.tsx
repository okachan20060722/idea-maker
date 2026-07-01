'use client';

import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="flex items-center justify-between p-4 bg-gray-900 text-white shadow-md">
      <Link href="/" className="text-xl font-bold">
        Idea Maker
      </Link>
      
      <nav>
        {!loading && (
          <ul className="flex space-x-6 items-center">
            <li>
              <Link href="/timeline" className="hover:text-gray-300">
                みんなのアイデア
              </Link>
            </li>
            {user ? (
              <>
                <li>
                  <Link href="/mypage" className="hover:text-gray-300">
                    マイページ
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
