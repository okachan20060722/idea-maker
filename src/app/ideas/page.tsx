"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ideaService, Idea } from '@/services/ideaService';
import { Trash2, Plus, Sparkles, AlertCircle } from 'lucide-react';

export default function IdeasPage() {
  const { user, loading } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);

  useEffect(() => {
    const fetchIdeas = async () => {
      if (loading) return;
      
      setIsLoadingIdeas(true);
      try {
        if (user) {
          const fetchedIdeas = await ideaService.getIdeas(user.uid);
          setIdeas(fetchedIdeas);
        } else {
          const localIdeas = ideaService.getLocalIdeas();
          setIdeas(localIdeas);
        }
      } catch (error) {
        console.error("Failed to fetch ideas:", error);
      } finally {
        setIsLoadingIdeas(false);
      }
    };

    fetchIdeas();
  }, [user, loading]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("このアイデアを削除してもよろしいですか？")) return;

    try {
      if (user) {
        await ideaService.deleteIdea(id, user.uid);
      } else {
        ideaService.deleteLocalIdea(id);
      }
      setIdeas(prev => prev.filter(idea => idea.id !== id));
    } catch (error) {
      console.error("Failed to delete idea:", error);
      alert("削除に失敗しました。");
    }
  };

  if (loading || isLoadingIdeas) {
    return (
      <main className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">アイデアを読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-4 text-blue-600">
          <Sparkles size={32} />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">保存したアイデア</h1>
        <p className="text-gray-600">
          {user ? 'あなたのアイデア一覧です。' : '現在ブラウザに保存されているアイデアです。ログインすると永続的に保存できます。'}
        </p>
      </header>

      {!user && ideas.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md mb-8 flex items-start max-w-2xl mx-auto">
          <AlertCircle className="text-amber-500 mt-0.5 mr-3 flex-shrink-0" size={20} />
          <p className="text-amber-800 text-sm">
            現在は未ログインのため、ブラウザを閉じるとデータが消える場合があります。
            大切にしたいアイデアはログインして保存することをおすすめします。
          </p>
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 mt-8">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="text-gray-300" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">まだアイデアがありません</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            新しいアイデアを生成して、ここに保存しましょう。AIがあなたの条件に合わせて提案します。
          </p>
          <Link href="/create" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-full shadow hover:bg-blue-700 transition">
            <Plus size={20} className="mr-2" />
            アイデアを作成する
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <div key={idea.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group relative flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{idea.title}</h3>
                <button 
                  onClick={() => handleDelete(idea.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition opacity-0 group-hover:opacity-100 flex-shrink-0"
                  aria-label="削除"
                  title="削除"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{idea.summary}</p>
              
              <div className="space-y-3 pt-4 border-t border-gray-50 text-sm mt-auto">
                <div>
                  <span className="text-xs font-semibold text-gray-400 block mb-1">ターゲット層</span>
                  <span className="text-gray-800 line-clamp-1">{idea.target}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 block mb-1">差別化</span>
                  <span className="text-gray-800 line-clamp-1">{idea.differentiation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
