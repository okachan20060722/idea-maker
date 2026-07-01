import React from 'react';
import { Idea } from '../services/ideaService';
import { Heart, ThumbsUp, Hash, Trash2, MessageSquare } from 'lucide-react';
import { formatDateTime } from '../lib/formatDate';

interface IdeaCardProps {
  idea: Idea;
  onClick: () => void;
  currentUserId?: string;
  onToggleFavorite?: (idea: Idea, e: React.MouseEvent) => void;
  onToggleLike?: (idea: Idea, e: React.MouseEvent) => void;
  onDelete?: (ideaId: string, e: React.MouseEvent) => void;
}

export default function IdeaCard({
  idea,
  onClick,
  currentUserId,
  onToggleFavorite,
  onToggleLike,
  onDelete
}: IdeaCardProps) {
  const isOwner = currentUserId === idea.user_id || idea.user_id === 'guest';
  const isFavorited = currentUserId ? (idea.favoritedBy || []).includes(currentUserId) : false;
  const isLiked = currentUserId ? (idea.likedBy || []).includes(currentUserId) : false;
  const likesCount = idea.likesCount || 0;
  const displayTags = idea.isPublic && idea.tags ? idea.tags : (idea.keywords || []);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col h-full relative cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-gray-900 line-clamp-2 pr-12 group-hover:text-indigo-600 transition-colors">{idea.title}</h3>

        <div className="absolute top-4 right-4 flex space-x-2">
          {/* Heart icon for global favorite status */}
          {isFavorited && (
            <Heart className="text-red-500" size={20} fill="currentColor" />
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

          <div className="flex items-center space-x-3">
            {idea.isPublic && (
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-medium">公開中</span>
            )}

            {/* Quick Actions */}
            {currentUserId && !isOwner && onToggleLike && (
              <button
                onClick={(e) => onToggleLike(idea, e)}
                className={`flex items-center text-xs font-medium transition ${isLiked ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-500'}`}
              >
                <ThumbsUp size={14} fill={isLiked ? "currentColor" : "none"} className="mr-1" />
                {likesCount > 0 && likesCount}
              </button>
            )}

            {currentUserId && onToggleFavorite && (
              <button
                onClick={(e) => onToggleFavorite(idea, e)}
                className={`flex items-center text-xs font-medium transition ${isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
              >
                <Heart size={14} fill={isFavorited ? "currentColor" : "none"} className="mr-1" />
              </button>
            )}

            {isOwner && onDelete && (
              <button
                onClick={(e) => onDelete(idea.id, e)}
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
  );
}
