'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ideaService, Idea } from '../../services/ideaService';
import { userService, UserProfile } from '../../services/userService';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Search, UserMinus, FileText, Heart, ThumbsUp } from 'lucide-react';
import IdeaCard from '../../components/IdeaCard';
import IdeaModal from '../../components/IdeaModal';
import PublishModal from '../../components/PublishModal';

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
  const [profile, setProfile] = useState<UserProfile>({ userName: '', age: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Search state
  const [searchKeyword, setSearchKeyword] = useState('');

  // Modal state
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [publishModalIdea, setPublishModalIdea] = useState<Idea | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    if (user) {
      loadData();
    }
  }, [user, loading, router]);

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
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await userService.updateUserProfile(user.uid, profile);
      setIsEditingProfile(false);
      alert('プロフィールを保存しました。');
    } catch (error) {
      console.error(error);
      alert('プロフィールの保存に失敗しました。');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!confirm('本当に退会しますか？この操作は取り消せません。\n保存したすべてのアイデアも削除されます。')) return;
    
    try {
      await userService.deleteUserAccount(user.uid);
      alert('退会処理が完了しました。ご利用ありがとうございました。');
      router.push('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      alert(error.message || '退会処理に失敗しました。');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
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
    if (!user) return;
    try {
      const isFavorited = (idea.favoritedBy || []).includes(user.uid);
      const newStatus = await ideaService.toggleFavorite(idea.id, idea.user_id, user.uid);
      
      const newFavoritedBy = newStatus 
        ? [...(idea.favoritedBy || []), user.uid] 
        : (idea.favoritedBy || []).filter(id => id !== user.uid);
        
      const updatedIdea = { ...idea, favoritedBy: newFavoritedBy };
      updateIdeaInLists(updatedIdea);

      // Add or remove from favoriteIdeas list dynamically
      if (newStatus) {
        if (!favoriteIdeas.find(i => i.id === idea.id)) {
          setFavoriteIdeas(prev => [updatedIdea, ...prev]);
        }
      } else {
        setFavoriteIdeas(prev => prev.filter(i => i.id !== idea.id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleLike = async (idea: Idea, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
    } catch (error) {
      console.error(error);
    }
  };

  const handleTogglePublicClick = async (idea: Idea) => {
    if (!user) return;
    if (idea.isPublic) {
      if (confirm('非公開にしますか？')) {
        try {
          await ideaService.unpublishIdea(idea.id, user.uid);
          updateIdeaInLists({ ...idea, isPublic: false });
        } catch (error) {
          console.error(error);
        }
      }
    } else {
      setPublishModalIdea(idea);
      setIsPublishModalOpen(true);
    }
  };

  const handlePublishConfirm = async (ideaId: string, tags: string[], commentsEnabled: boolean) => {
    if (!user || !publishModalIdea) return;
    try {
      await ideaService.publishIdea(ideaId, user.uid, tags, commentsEnabled);
      updateIdeaInLists({ ...publishModalIdea, isPublic: true, tags, commentsEnabled });
      setIsPublishModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('公開に失敗しました');
    }
  };

  const handleDelete = async (ideaId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;
    if (confirm('本当に削除しますか？')) {
      await ideaService.deleteIdea(ideaId, user.uid);
      setMyIdeas(prev => prev.filter(i => i.id !== ideaId));
      setFavoriteIdeas(prev => prev.filter(i => i.id !== ideaId));
      setLikedIdeas(prev => prev.filter(i => i.id !== ideaId));
      if (selectedIdea?.id === ideaId) {
        setIsModalOpen(false);
      }
    }
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
  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <h1 className="text-2xl font-bold mb-6 pb-2 border-b">マイページ</h1>
        
        <div className="mb-6 flex flex-col md:flex-row gap-8">
          <div className="flex-grow">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">プロフィール情報</h2>
            {isEditingProfile ? (
              <div className="space-y-4 max-w-sm">
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
              <div className="space-y-3">
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
              currentUserId={user.uid}
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
        currentUserId={user.uid}
        currentUserName={profile.userName || user.displayName || '名無し'}
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
    </div>
  );
}
