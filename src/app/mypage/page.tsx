'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ideaService, Idea } from '../../services/ideaService';
import { userService, UserProfile } from '../../services/userService';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Search, UserMinus, FileText, Heart, ThumbsUp, Camera, User } from 'lucide-react';
import Image from 'next/image';
import ConfirmModal from '@/components/ConfirmModal';
import IdeaCard from '@/components/IdeaCard';
import IdeaModal from '@/components/IdeaModal';
import PublishModal from '@/components/PublishModal';
import { getFirebaseErrorMessage } from '@/lib/firebaseError';

type TabType = 'myideas' | 'favorites' | 'likes';

export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [myIdeas, setMyIdeas] = useState<Idea[]>([]);
  const [favoriteIdeas, setFavoriteIdeas] = useState<Idea[]>([]);
  const [likedIdeas, setLikedIdeas] = useState<Idea[]>([]);
  
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('myideas');
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile>({ userName: '', age: '', avatarUrl: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Search state
  const [searchKeyword, setSearchKeyword] = useState('');

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
    if (!loading) {
      if (user) {
        loadData();
      } else {
        // Load guest data
        const localIdeas = ideaService.getLocalIdeas();
        const localFavorites = ideaService.getLocalFavorites();
        setMyIdeas(localIdeas);
        setFavoriteIdeas(localFavorites);
        setFetching(false);
      }
    }
  }, [user, loading]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [ideasData, favData, likedData, profileData] = await Promise.all([
        ideaService.getIdeas(user.uid),
        ideaService.getFavorites(user.uid),
        ideaService.getLikedIdeas(user.uid),
        userService.getUserProfile(user.uid)
      ]);
      setMyIdeas(ideasData);
      setFavoriteIdeas(favData);
      setLikedIdeas(likedData);
      
      if (profileData) {
        setProfile(profileData);
      } else {
        setProfile({ userName: user.displayName || '', age: '' });
      }
    } catch (error: any) {
      console.error(error);
      alert(getFirebaseErrorMessage(error));
    } finally {
      setFetching(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      let finalAvatarUrl = profile.avatarUrl;
      if (avatarFile) {
        finalAvatarUrl = await userService.uploadAvatar(user.uid, avatarFile);
      }
      const updatedProfile = { ...profile, avatarUrl: finalAvatarUrl };
      await userService.updateUserProfile(user.uid, updatedProfile);
      setProfile(updatedProfile);
      setIsEditingProfile(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      alert('プロフィールを保存しました。');
    } catch (error: any) {
      console.error(error);
      alert('プロフィールの保存に失敗しました: ' + getFirebaseErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleDeleteAccount = () => {
    if (!user) return;
    showConfirm(
      'アカウントの退会',
      '本当に退会しますか？この操作は取り消せません。\n保存したすべてのアイデアも削除されます。',
      async () => {
        try {
          await userService.deleteUserAccount(user.uid);
          alert('退会処理が完了しました。ご利用ありがとうございました。');
          router.push('/');
        } catch (error: any) {
          console.error('Delete account error:', error);
          alert(getFirebaseErrorMessage(error));
        }
      },
      true,
      '退会する'
    );
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error: any) {
      console.error('Logout error:', error);
      alert(getFirebaseErrorMessage(error));
    }
  };

  const updateIdeaInLists = (updatedIdea: Idea) => {
    setMyIdeas(prev => prev.map(i => i.id === updatedIdea.id ? updatedIdea : i));
    setFavoriteIdeas(prev => prev.map(i => i.id === updatedIdea.id ? updatedIdea : i));
    setLikedIdeas(prev => prev.map(i => i.id === updatedIdea.id ? updatedIdea : i));
    if (selectedIdea?.id === updatedIdea.id) {
      setSelectedIdea(updatedIdea);
    }
  };

  const handleToggleFavorite = async (idea: Idea, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Auth loading protection
    if (loading) return;

    if (!user) {
      // Guest favorite logic
      const existingStatus = (idea.favoritedBy || []).includes('guest');
      const expectedNewStatus = !existingStatus;
      
      const newFavoritedBy = expectedNewStatus 
        ? [...(idea.favoritedBy || []), 'guest'] 
        : (idea.favoritedBy || []).filter(id => id !== 'guest');
        
      const updatedIdea = { ...idea, favoritedBy: newFavoritedBy };
      ideaService.toggleLocalFavorite(updatedIdea);

      updateIdeaInLists(updatedIdea);
      setFavoriteIdeas(prev => {
        if (expectedNewStatus) {
          if (!prev.find(i => i.id === idea.id)) return [updatedIdea, ...prev];
          return prev.map(i => i.id === idea.id ? updatedIdea : i);
        } else {
          return prev.filter(i => i.id !== idea.id);
        }
      });
      return;
    }

    const currentUserId = user.uid;
    const isFavorited = (idea.favoritedBy || []).includes(currentUserId);
    const expectedNewStatus = !isFavorited;
    
    const newFavoritedBy = expectedNewStatus 
      ? [...(idea.favoritedBy || []), currentUserId] 
      : (idea.favoritedBy || []).filter(id => id !== currentUserId);
      
    const updatedIdea = { ...idea, favoritedBy: newFavoritedBy };
    
    updateIdeaInLists(updatedIdea);
    setFavoriteIdeas(prev => {
      if (expectedNewStatus) {
        if (!prev.find(i => i.id === idea.id)) return [updatedIdea, ...prev];
        return prev.map(i => i.id === idea.id ? updatedIdea : i);
      } else {
        return prev.filter(i => i.id !== idea.id);
      }
    });

    try {
      const targetUserId = idea.user_id || currentUserId;
      if (!idea.id || !targetUserId) throw new Error("Missing idea or user ID");
      await ideaService.toggleFavorite(idea.id, targetUserId, currentUserId);
    } catch (error: any) {
      console.error('Toggle favorite failed:', error);
      
      if (error.message === "Idea not found") {
        // Idea was likely deleted by the owner or migration bug
        alert("このアイデアは見つかりませんでした（既に削除されている可能性があります）。");
        setMyIdeas(prev => prev.filter(i => i.id !== idea.id));
        setLikedIdeas(prev => prev.filter(i => i.id !== idea.id));
        setFavoriteIdeas(prev => prev.filter(i => i.id !== idea.id));
        if (selectedIdea?.id === idea.id) setSelectedIdea(null);
        return;
      }
      
      updateIdeaInLists(idea); // revert optimistic update
      setFavoriteIdeas(prev => {
        if (isFavorited) {
          if (!prev.find(i => i.id === idea.id)) return [idea, ...prev];
          return prev.map(i => i.id === idea.id ? idea : i);
        } else {
          return prev.filter(i => i.id !== idea.id);
        }
      });
      alert('お気に入りの更新に失敗しました: ' + getFirebaseErrorMessage(error));
    }
  };

  const handleToggleLike = async (idea: Idea, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (loading) return;
    if (!user) return;
    try {
      const isLiked = (idea.likedBy || []).includes(user.uid);
      const newStatus = await ideaService.toggleLike(idea.id, idea.user_id, user.uid);
      
      const newLikedBy = newStatus 
        ? [...(idea.likedBy || []), user.uid] 
        : (idea.likedBy || []).filter(id => id !== user.uid);
        
      const newLikesCount = (idea.likesCount || 0) + (newStatus ? 1 : -1);
      const updatedIdea = { ...idea, likedBy: newLikedBy, likesCount: newLikesCount };
      updateIdeaInLists(updatedIdea);

      // Add or remove from likedIdeas list dynamically
      if (newStatus) {
        if (!likedIdeas.find(i => i.id === idea.id)) {
          setLikedIdeas(prev => [updatedIdea, ...prev]);
        }
      } else {
        setLikedIdeas(prev => prev.filter(i => i.id !== idea.id));
      }
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
            updateIdeaInLists({ ...idea, isPublic: false });
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
      updateIdeaInLists(updatedIdea);
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

  const handleDelete = (ideaId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const deleteAction = async () => {
      if (!user) {
        ideaService.deleteLocalIdea(ideaId);
        setMyIdeas(prev => prev.filter(i => i.id !== ideaId));
        if (selectedIdea?.id === ideaId) setIsModalOpen(false);
        return;
      }

      try {
        await ideaService.deleteIdea(ideaId, user.uid);
        setMyIdeas(prev => prev.filter(i => i.id !== ideaId));
        setFavoriteIdeas(prev => prev.filter(i => i.id !== ideaId));
        setLikedIdeas(prev => prev.filter(i => i.id !== ideaId));
        if (selectedIdea?.id === ideaId) {
          setIsModalOpen(false);
        }
      } catch (error: any) {
        console.error(error);
        alert('削除に失敗しました: ' + getFirebaseErrorMessage(error));
      }
    };

    showConfirm(
      'アイデアの削除',
      '本当にこのアイデアを削除しますか？\nこの操作は取り消せません。',
      deleteAction,
      true,
      '削除する'
    );
  };

  const openModal = (idea: Idea) => {
    setSelectedIdea(idea);
    setIsModalOpen(true);
  };

  const getCurrentList = () => {
    switch (activeTab) {
      case 'myideas': return myIdeas;
      case 'favorites': return favoriteIdeas;
      case 'likes': return likedIdeas;
      default: return myIdeas;
    }
  };

  const currentList = getCurrentList();
  const filteredIdeas = currentList.filter(idea => {
    if (!searchKeyword) return true;
    const lowerKeyword = searchKeyword.toLowerCase();
    return idea.title.toLowerCase().includes(lowerKeyword) || idea.summary.toLowerCase().includes(lowerKeyword);
  });

  if (loading || fetching) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile Section */}
      {user ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h1 className="text-2xl font-bold mb-6 pb-2 border-b">マイページ</h1>
        
        <div className="mb-6 flex flex-col md:flex-row gap-8">
          <div className="flex-grow">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">プロフィール情報</h2>
            {isEditingProfile ? (
              <div className="space-y-4 max-w-sm">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative w-20 h-20 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-100 flex-shrink-0 flex items-center justify-center">
                    {(avatarPreview || profile.avatarUrl) ? (
                      <img src={avatarPreview || profile.avatarUrl} alt="Avatar" className="object-cover w-full h-full" />
                    ) : (
                      <User size={32} className="text-gray-400" />
                    )}
                    <label className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                      <Camera size={20} className="text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  </div>
                  <div className="text-sm text-gray-500">アイコンをクリックして変更</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ユーザー名</label>
                  <input 
                    type="text" 
                    value={profile.userName || ''} 
                    onChange={e => setProfile({...profile, userName: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">年代</label>
                  <select 
                    value={profile.age || ''} 
                    onChange={e => setProfile({...profile, age: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">未設定</option>
                    <option value="10代">10代</option>
                    <option value="20代">20代</option>
                    <option value="30代">30代</option>
                    <option value="40代">40代</option>
                    <option value="50代">50代</option>
                    <option value="60代以上">60代以上</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={handleSaveProfile} 
                    disabled={savingProfile}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    {savingProfile ? '保存中...' : '保存する'}
                  </button>
                  <button 
                    onClick={() => setIsEditingProfile(false)} 
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden border border-gray-100 flex-shrink-0 flex items-center justify-center">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="object-cover w-full h-full" />
                  ) : (
                    <User size={24} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-gray-700"><strong>ユーザー名:</strong> {profile.userName || user.displayName || '未設定'}</p>
                  <p className="text-gray-700"><strong>年代:</strong> {profile.age || '未設定'}</p>
                  <p className="text-gray-700"><strong>メールアドレス:</strong> {user.email}</p>
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    プロフィールを編集する
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col justify-end gap-3 md:w-48">
            <button 
              onClick={handleLogout}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-center w-full"
            >
              ログアウト
            </button>
            <button 
              onClick={handleDeleteAccount}
              className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2 w-full"
            >
              <UserMinus size={16} />
              退会する
            </button>
          </div>
        </div>
      </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">ログインして全機能を利用しよう</h2>
            <p className="text-gray-600 text-sm mt-1">作成したアイデアをクラウドに保存し、みんなのアイデアに公開したり、お気に入り機能が使えるようになります。</p>
          </div>
          <button 
            onClick={() => router.push('/login')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition shadow-md whitespace-nowrap font-medium"
          >
            ログイン / 新規登録
          </button>
        </div>
      )}
      
      {/* Tabs and Search */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-4">
          <div className="flex space-x-1 border-b border-gray-200 w-full md:w-auto overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab('myideas')}
              className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'myideas' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <FileText size={16} className="mr-2" />
              マイアイデア <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{myIdeas.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'favorites' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <Heart size={16} className="mr-2" />
              お気に入り <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{favoriteIdeas.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('likes')}
              className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'likes' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <ThumbsUp size={16} className="mr-2" />
              いいね <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{likedIdeas.length}</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-64 flex-shrink-0">
            <input
              type="text"
              placeholder="キーワードで絞り込み..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Search size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Lists */}
      {filteredIdeas.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-12 text-center border border-gray-100">
          <p className="text-gray-500">
            {currentList.length === 0 
              ? (activeTab === 'myideas' ? 'まだ作成したアイデアがありません。' 
                : activeTab === 'favorites' ? 'お気に入りに登録したアイデアがありません。' 
                : 'いいねしたアイデアがありません。') 
              : '検索条件に一致するアイデアが見つかりません。'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={`${activeTab}-${idea.id}`}
              idea={idea}
              onClick={() => openModal(idea)}
              currentUserId={user?.uid}
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
        currentUserId={user?.uid || ''}
        currentUserName={profile?.userName || user?.displayName || 'ゲスト'}
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
    </div>
  );
}
