"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ideaService, Idea } from '@/services/ideaService';
import { getFirebaseErrorMessage } from '@/lib/firebaseError';
import { Trash2, Plus, Sparkles, AlertCircle } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import PublishModal from '@/components/PublishModal';
import IdeaCard from '@/components/IdeaCard';
import IdeaModal from '@/components/IdeaModal';

export default function IdeasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);

  // Modal State
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [publishModalIdea, setPublishModalIdea] = useState<Idea | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void, isDestructive = false, confirmText = 'OK') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm,
      isDestructive,
      confirmText
    });
  };

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

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    showConfirm(
      'アイデアの削除',
      'このアイデアを削除してもよろしいですか？\nこの操作は取り消せません。',
      async () => {
        try {
          if (user) {
            await ideaService.deleteIdea(id, user.uid);
          } else {
            ideaService.deleteLocalIdea(id);
          }
          setIdeas(prev => prev.filter(idea => idea.id !== id));
          if (selectedIdea?.id === id) {
            setIsModalOpen(false);
          }
        } catch (error) {
          console.error("Failed to delete idea:", error);
        }
      },
      true,
      '削除する'
    );
  };

  const handleToggleFavorite = async (idea: Idea, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Auth loading protection
    if (loading) return;

    if (!user) {
      // Guest favorite logic
      const newStatus = ideaService.toggleLocalFavorite(idea);
      const newFavoritedBy = newStatus 
        ? [...(idea.favoritedBy || []), 'guest'] 
        : (idea.favoritedBy || []).filter(id => id !== 'guest');
      
      const updatedIdea = { ...idea, favoritedBy: newFavoritedBy };
      setIdeas(prev => prev.map(i => i.id === idea.id ? updatedIdea : i));
      if (selectedIdea?.id === idea.id) {
        setSelectedIdea(updatedIdea);
      }
      return;
    }
    const isFavorited = (idea.favoritedBy || []).includes(user.uid);
    const expectedNewStatus = !isFavorited;
    
    // Optimistic UI update
    const newFavoritedBy = expectedNewStatus 
      ? [...(idea.favoritedBy || []), user.uid] 
      : (idea.favoritedBy || []).filter(id => id !== user.uid);
    
    const updatedIdea = { ...idea, favoritedBy: newFavoritedBy };
    setIdeas(prev => prev.map(i => i.id === idea.id ? updatedIdea : i));
    if (selectedIdea?.id === idea.id) {
      setSelectedIdea(updatedIdea);
    }

    try {
      await ideaService.toggleFavorite(idea.id, idea.user_id, user.uid);
    } catch (error: any) {
      console.error(error);
      // Revert optimistic update on failure
      setIdeas(prev => prev.map(i => i.id === idea.id ? idea : i));
      if (selectedIdea?.id === idea.id) {
        setSelectedIdea(idea);
      }
    }
  };

  const openModal = (idea: Idea) => {
    setSelectedIdea(idea);
    setIsModalOpen(true);
  };

  const handleTogglePublicClick = async (idea: Idea) => {
    if (!user) {
      showConfirm(
        'ログインが必要です',
        'SNSへの投稿にはログインが必要です。ログイン画面へ移動しますか？',
        () => router.push('/login'),
        false,
        'ログインする'
      );
      return;
    }
    if (idea.isPublic) {
      showConfirm(
        '非公開にする',
        '本当にこのアイデアを非公開にしますか？',
        async () => {
          try {
            await ideaService.unpublishIdea(idea.id, user.uid);
            const updatedIdea = { ...idea, isPublic: false };
            setIdeas(prev => prev.map(i => i.id === idea.id ? updatedIdea : i));
            if (selectedIdea?.id === idea.id) setSelectedIdea(updatedIdea);
          } catch (error: any) {
            console.error(error);
          }
        },
        true,
        '非公開にする'
      );
    } else {
      setPublishModalIdea(idea);
      setIsPublishModalOpen(true);
    }
  };

  const handlePublishConfirm = async (ideaId: string, tags: string[], commentsEnabled: boolean) => {
    if (!user || !publishModalIdea) return;
    try {
      let finalIdeaId = ideaId;

      // Migrate local idea to Firestore if needed
      if (ideaId.startsWith('local_')) {
        const ideaToSave = { ...publishModalIdea, user_id: user.uid, isPublic: true, tags, commentsEnabled };
        delete (ideaToSave as any).id;
        delete (ideaToSave as any).isFavorite;
        
        const saved = await ideaService.saveIdea(ideaToSave);
        finalIdeaId = saved.id;
      } else {
        await ideaService.publishIdea(finalIdeaId, user.uid, tags, commentsEnabled);
      }

      const updatedIdea = { ...publishModalIdea, id: finalIdeaId, isPublic: true, tags, commentsEnabled, user_id: user.uid };
      setIdeas(prev => prev.map(i => i.id === ideaId ? updatedIdea : i));
      if (selectedIdea?.id === ideaId) setSelectedIdea(updatedIdea);
      setIsPublishModalOpen(false);

      showConfirm(
        '公開完了',
        'アイデアをSNS（タイムライン）に公開しました！',
        () => router.push('/timeline'),
        false,
        'タイムラインを見る'
      );
    } catch (error: any) {
      console.error(error);
      showConfirm(
        'エラー',
        '公開に失敗しました: ' + getFirebaseErrorMessage(error),
        () => {},
        false,
        '閉じる'
      );
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
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">保存済みのアイデア</h1>
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
            <IdeaCard
              key={idea.id}
              idea={idea}
              onClick={() => openModal(idea)}
              currentUserId={user?.uid}
              onToggleFavorite={handleToggleFavorite}
              onTogglePublic={handleTogglePublicClick}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <IdeaModal
        idea={selectedIdea}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUserId={user?.uid}
        onToggleFavorite={handleToggleFavorite}
        onTogglePublic={handleTogglePublicClick}
        onDelete={handleDelete}
      />

      <PublishModal
        idea={publishModalIdea}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={handlePublishConfirm}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        isDestructive={confirmConfig.isDestructive}
        confirmText={confirmConfig.confirmText}
      />
    </main>
  );
}
