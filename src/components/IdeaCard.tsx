import React, { useState } from 'react';
import { Idea } from '../services/ideaService';
import { Heart, ThumbsUp, Hash, Trash2, MessageSquare, UserPlus, UserMinus, X, Share2 } from 'lucide-react';
import { formatDateTime } from '../lib/formatDate';

interface IdeaCardProps {
  idea: Idea;
  onClick: () => void;
  currentUserId?: string;
  isFollowingOwner?: boolean;
  onToggleFollow?: (targetUserId: string, e: React.MouseEvent) => void;
  onToggleFavorite?: (idea: Idea, e: React.MouseEvent) => void;
  onToggleLike?: (idea: Idea, e: React.MouseEvent) => void;
  onTogglePublic?: (idea: Idea, e: React.MouseEvent) => void;
  onToggleSave?: (e: React.MouseEvent) => void;
  onDelete?: (ideaId: string, e: React.MouseEvent) => void;
}

export default function IdeaCard({
  idea,
  onClick,
  currentUserId,
  isFollowingOwner,
  onToggleFollow,
  onToggleFavorite,
  onToggleLike,
  onTogglePublic,
  onDelete
}: IdeaCardProps) {
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const handleScoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsScoreModalOpen(true);
  };

  const closeScoreModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsScoreModalOpen(false);
  };

  // For guests, currentUserId is usually undefined or empty string.
  // We can consider an idea to be "owned" by the guest if the user_id is 'guest'.
  const isOwner = idea.user_id === currentUserId || idea.user_id === 'guest';
  const isFavorited = idea.favoritedBy?.includes(currentUserId || 'guest') || false;
  const isLiked = idea.likedBy?.includes(currentUserId || 'guest') || false;
  const likesCount = idea.likesCount || 0;
  const favoritesCount = idea.favoritedBy?.length || 0;
  const displayTags = idea.isPublic && idea.tags ? idea.tags : (idea.keywords || []);

  return (
    <>
      <div
        onClick={onClick}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col h-full relative cursor-pointer group"
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2 pr-16 group-hover:text-indigo-600 transition-colors">{idea.title}</h3>

          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            {idea.feasibilityScore !== undefined && (
              <button
                onClick={handleScoreClick}
                className="inline-flex items-center text-xs px-2 py-1 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 rounded-full font-bold border border-indigo-100 shadow-sm hover:from-indigo-100 hover:to-blue-100 transition transform hover:scale-105 active:scale-95"
                title="実現性スコアの詳細を見る"
              >
                <span className="mr-1" role="img" aria-label="rocket">⚡</span>
                {idea.feasibilityScore}%
              </button>
            )}
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{idea.summary}</p>

        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {displayTags.slice(0, 3).map((kw, i) => (
              <span key={i} className="inline-flex items-center text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded-md border border-gray-100">
                <Hash size={10} className="mr-0.5" />
                {kw}
              </span>
            ))}
            {displayTags.length > 3 && (
              <span className="inline-flex items-center text-xs px-2 py-1 bg-gray-50 text-gray-400 rounded-md border border-gray-100">
                +{displayTags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="space-y-3 pt-4 border-t border-gray-50 text-sm mt-auto">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">ターゲット層</span>
            <span className="text-gray-800 line-clamp-1">{idea.target}</span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-gray-400">
              {formatDateTime(idea.createdAt)}
            </span>

            <div className="flex items-center space-x-3 relative z-10">
              {idea.isPublic && (
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-medium">公開中</span>
              )}

              {/* Quick Actions */}
              {currentUserId && !isOwner && onToggleFollow && idea.isPublic && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleFollow(idea.user_id, e); }}
                  className={`flex items-center text-xs font-medium transition ${isFollowingOwner ? 'text-green-600' : 'text-gray-400 hover:text-green-500'}`}
                  title={isFollowingOwner ? "フォロー解除" : "フォローする"}
                >
                  {isFollowingOwner ? <UserMinus size={14} className="mr-1" /> : <UserPlus size={14} className="mr-1" />}
                </button>
              )}

              {currentUserId && !isOwner && onToggleLike && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleLike(idea, e); }}
                  className={`flex items-center text-xs font-medium px-2 py-1 rounded-full transition ${isLiked ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                >
                  <ThumbsUp size={14} fill={isLiked ? "currentColor" : "none"} className="mr-1" />
                  {likesCount > 0 && likesCount}
                </button>
              )}

              {onToggleFavorite && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(idea, e); }}
                  className={`flex items-center text-xs font-medium px-2 py-1 rounded-full transition ${isFavorited ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-100'}`}
                >
                  <Heart size={14} fill={isFavorited ? "currentColor" : "none"} className={favoritesCount > 0 ? "mr-1" : ""} />
                  {favoritesCount > 0 && favoritesCount}
                </button>
              )}

              {isOwner && onTogglePublic && (
                <button
                  onClick={(e) => { e.stopPropagation(); onTogglePublic(idea, e); }}
                  className={`flex items-center text-xs font-medium px-2 py-1 rounded-full transition ${idea.isPublic ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                  title={idea.isPublic ? 'SNS公開中' : 'SNSに投稿'}
                >
                  <Share2 size={14} className="mr-1" />
                  {idea.isPublic ? '公開中' : '投稿'}
                </button>
              )}

              {isOwner && onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(idea.id, e); }}
                  className="text-gray-400 hover:text-red-500 transition"
                  title="削除"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Score Detail Modal */}
      {isScoreModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeScoreModal}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
              <button 
                onClick={closeScoreModal}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition"
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full flex-shrink-0">
                  <span className="text-3xl" role="img" aria-label="rocket">⚡</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">実現性スコア</h3>
                  <div className="text-3xl font-extrabold mt-1">{idea.feasibilityScore}%</div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <h4 className="text-sm font-bold text-indigo-800 mb-3 border-b border-indigo-50 pb-2">スコアの理由と実現への具体案</h4>
              <div className="text-gray-700 leading-relaxed max-h-[50vh] overflow-y-auto pr-2 whitespace-pre-wrap text-sm md:text-base">
                {idea.feasibilityActionPlan || "詳細なアクションプランはまだありません。"}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeScoreModal}
                  className="px-5 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-full hover:bg-indigo-100 transition"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
