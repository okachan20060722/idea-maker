"use client";

import React, { useEffect, useState } from 'react';
import { ideaService, Idea } from '@/services/ideaService';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { userService, UserProfile } from '@/services/userService';
import { getFirebaseErrorMessage } from '@/lib/firebaseError';
import { Globe, RefreshCw, Search } from 'lucide-react';
import IdeaCard from '@/components/IdeaCard';
import IdeaModal from '@/components/IdeaModal';
import PublishModal from '@/components/PublishModal';
import ConfirmModal from '@/components/ConfirmModal';

export default function TimelinePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
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
    const fetchTimeline = async () => {
      setIsLoading(true);
      try {
        const publicIdeas = await ideaService.getPublicIdeas();
        
        // Hybrid Sort: Likes + Favorites Count Desc > Newest
        let sortedIdeas = [...publicIdeas].sort((a, b) => {
          const scoreA = (a.likesCount || 0) + (a.favoritedBy?.length || 0);
          const scoreB = (b.likesCount || 0) + (b.favoritedBy?.length || 0);
          if (scoreA !== scoreB) {
            return scoreB - scoreA;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        // 20% Random Injection
        sortedIdeas = sortedIdeas.map((idea, index) => {
          if (Math.random() < 0.2 && index > 0) {
            // Swap with a random earlier item
            const randomIndex = Math.floor(Math.random() * index);
            const temp = sortedIdeas[randomIndex];
            sortedIdeas[randomIndex] = idea;
            return temp;
          }
          return idea;
        });

        setIdeas(sortedIdeas);

        if (user) {
          const profile = await userService.getUserProfile(user.uid);
          if (profile && profile.following) {
            setFollowing(profile.following);
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch public ideas:", error);
        alert(getFirebaseErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeline();
  }, [user]);

  const updateIdeaInList = (updatedIdea: Idea) => {
    setIdeas(prev => prev.map(i => i.id === updatedIdea.id ? updatedIdea : i));
    if (selectedIdea?.id === updatedIdea.id) {
      setSelectedIdea(updatedIdea);
    }
  };

  const handleToggleFollow = async (targetUserId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      alert("ログインが必要です");
      return;
    }
    if (user.uid === targetUserId) return;

    try {
      const isNowFollowing = await userService.toggleFollow(user.uid, targetUserId);
      setFollowing(prev => 
        isNowFollowing 
          ? [...prev, targetUserId] 
          : prev.filter(id => id !== targetUserId)
      );
    } catch (error: any) {
      console.error(error);
      alert('フォロー設定の更新に失敗しました: ' + getFirebaseErrorMessage(error));
    }
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
      updateIdeaInList({ ...idea, favoritedBy: newFavoritedBy });
      return;
    }
    const isFavorited = (idea.favoritedBy || []).includes(user.uid);
    const expectedNewStatus = !isFavorited;
    
    // Optimistic UI update
    const newFavoritedBy = expectedNewStatus 
      ? [...(idea.favoritedBy || []), user.uid] 
      : (idea.favoritedBy || []).filter(id => id !== user.uid);
    updateIdeaInList({ ...idea, favoritedBy: newFavoritedBy });

    try {
      await ideaService.toggleFavorite(idea.id, idea.user_id, user.uid);
    } catch (error: any) {
      console.error(error);
      // Revert optimistic update on failure
      updateIdeaInList(idea);
    }
  };

  const handleToggleLike = async (idea: Idea, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (loading) return;
    if (!user) {
      alert("ログインが必要です");
      return;
    }
    try {
      const newStatus = await ideaService.toggleLike(idea.id, idea.user_id, user.uid);
      const newLikedBy = newStatus 
        ? [...(idea.likedBy || []), user.uid] 
        : (idea.likedBy || []).filter(id => id !== user.uid);
      const newLikesCount = (idea.likesCount || 0) + (newStatus ? 1 : -1);
      updateIdeaInList({ ...idea, likedBy: newLikedBy, likesCount: newLikesCount });
    } catch (error: any) {
      console.error(error);
      alert(getFirebaseErrorMessage(error));
    }
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
            updateIdeaInList({ ...idea, isPublic: false });
            // Remove from timeline as it's no longer public
            setIdeas(prev => prev.filter(i => i.id !== idea.id));
            if (selectedIdea?.id === idea.id) setIsModalOpen(false);
          } catch (error: any) {
            console.error(error);
            alert(getFirebaseErrorMessage(error));
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
      updateIdeaInList(updatedIdea);
      setIsPublishModalOpen(false);

      showConfirm(
        '公開完了',
        'アイデアをSNS（タイムライン）に公開しました！',
        () => {},
        false,
        '閉じる'
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

  const handleDelete = (ideaId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;
    
    showConfirm(
      'アイデアの削除',
      '本当にこのアイデアを削除しますか？\nこの操作は取り消せません。',
      async () => {
        try {
          await ideaService.deleteIdea(ideaId, user.uid);
          setIdeas(prev => prev.filter(i => i.id !== ideaId));
          if (selectedIdea?.id === ideaId) {
            setIsModalOpen(false);
          }
        } catch (error: any) {
          console.error(error);
          alert('削除に失敗しました: ' + getFirebaseErrorMessage(error));
        }
      },
      true,
      '削除する'
    );
  };

  const openModal = (idea: Idea) => {
    setSelectedIdea(idea);
    setIsModalOpen(true);
  };

  const filteredIdeas = ideas.filter(idea => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = idea.title?.toLowerCase().includes(query) || false;
    const summaryMatch = idea.summary?.toLowerCase().includes(query) || false;
    const keywordMatch = idea.keywords?.some(kw => kw.toLowerCase().includes(query)) || false;
    const tagsMatch = idea.tags?.some(tag => tag.toLowerCase().includes(query)) || false;
    return titleMatch || summaryMatch || keywordMatch || tagsMatch;
  });

  if (isLoading) {
    return (
      <main className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500">タイムラインを読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-4 text-indigo-600">
          <Globe size={32} />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">みんなのアイデア</h1>
        <p className="text-gray-600">
          他のユーザーが公開したアイデアのタイムラインです。新しいひらめきを見つけましょう。
        </p>
      </header>

      <div className="mb-8 max-w-2xl mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={20} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="キーワードでアイデアを検索..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-gray-800"
          />
        </div>
      </div>

      {ideas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 mt-8">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Globe className="text-gray-300" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">まだ投稿がありません</h2>
          <p className="text-gray-500">
            あなたのアイデアをSNSに投稿して、最初の投稿者になりましょう！
          </p>
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 mt-8 animate-fade-in">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="text-gray-300" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">該当するアイデアが見つかりませんでした</h2>
          <p className="text-gray-500">
            別のキーワードを試すか、検索条件をクリアしてください。
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full font-medium hover:bg-indigo-100 transition"
          >
            検索をクリア
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onClick={() => openModal(idea)}
              currentUserId={user?.uid}
              isFollowingOwner={following.includes(idea.user_id)}
              onToggleFollow={handleToggleFollow}
              onToggleFavorite={handleToggleFavorite}
              onToggleLike={handleToggleLike}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <IdeaModal
        idea={selectedIdea}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUserId={user?.uid}
        currentUserName={user?.displayName || '名無し'}

        onToggleFavorite={(idea) => handleToggleFavorite(idea)}
        onToggleLike={(idea) => handleToggleLike(idea)}
        onTogglePublic={handleTogglePublicClick}
        onDelete={handleDelete}
      />

      {/* Publish Modal */}
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
