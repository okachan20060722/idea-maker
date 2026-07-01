import React from 'react';
import { Idea } from '../services/ideaService';
import { Heart, ThumbsUp, X, Share2, Trash2, Hash, MessageSquare, Send } from 'lucide-react';
import { ideaService, IdeaComment } from '../services/ideaService';
import { formatDateTime } from '../lib/formatDate';

interface IdeaModalProps {
  idea: Idea | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  currentUserName?: string;
  onToggleFavorite?: (idea: Idea) => void;
  onToggleLike?: (idea: Idea) => void;
  onTogglePublic?: (idea: Idea) => void;
  onDelete?: (ideaId: string) => void;
}

export default function IdeaModal({
  idea,
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  onToggleFavorite,
  onToggleLike,
  onTogglePublic,
  onDelete
}: IdeaModalProps) {
  const [comments, setComments] = React.useState<IdeaComment[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && idea && idea.commentsEnabled !== false) {
      ideaService.getComments(idea.id, idea.user_id).then(setComments).catch(console.error);
    }
  }, [isOpen, idea]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId || !idea) return;
    setIsSubmittingComment(true);
    try {
      const added = await ideaService.addComment(idea.id, idea.user_id, currentUserId, currentUserName || '名無し', newComment.trim());
      setComments([...comments, added]);
      setNewComment('');
    } catch (e) {
      console.error(e);
      alert('コメントの送信に失敗しました');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!isOpen || !idea) return null;

  const isOwner = currentUserId === idea.user_id || idea.user_id === 'guest';
  const isFavorited = currentUserId ? (idea.favoritedBy || []).includes(currentUserId) : false;
  const isLiked = currentUserId ? (idea.likedBy || []).includes(currentUserId) : false;
  const likesCount = idea.likesCount || 0;
  const displayTags = idea.isPublic && idea.tags ? idea.tags : (idea.keywords || []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity">
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 pr-8">{idea.title}</h2>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition bg-gray-50 hover:bg-gray-100 rounded-full p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">概要</h3>
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{idea.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-500 mb-2">想定ユーザー（ターゲット）</h3>
              <p className="text-gray-800">{idea.target}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-500 mb-2">差別化ポイント</h3>
              <p className="text-gray-800">{idea.differentiation}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">収益化案</h3>
            <p className="text-gray-800 bg-blue-50 p-4 rounded-xl border border-blue-100">{idea.monetization}</p>
          </div>

          {displayTags && displayTags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">キーワード / タグ</h3>
              <div className="flex flex-wrap gap-2">
                {displayTags.map((kw, i) => (
                  <span key={i} className="inline-flex items-center text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg">
                    <Hash size={14} className="mr-1 text-gray-400" />
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <MessageSquare size={20} className="mr-2 text-indigo-500" />
              コメント
            </h3>
            
            {idea.commentsEnabled === false ? (
              <div className="bg-gray-50 p-4 rounded-xl text-center text-gray-500 text-sm">
                この投稿へのコメントは受け付けていません
              </div>
            ) : (
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">まだコメントがありません</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-3 rounded-xl">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-semibold text-sm text-gray-800">{comment.userName}</span>
                          <span className="text-xs text-gray-400">{formatDateTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {currentUserId ? (
                  <div className="flex gap-2 mt-4">
                    <input
                      type="text"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                      placeholder="コメントを入力..."
                      className="flex-grow bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-center text-gray-500 mt-4">コメントするにはログインが必要です</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Favorite Button (Global) */}
            {currentUserId && onToggleFavorite && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(idea); }}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition ${isFavorited ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                <Heart size={18} fill={isFavorited ? "currentColor" : "none"} className={isFavorited ? "text-red-500 mr-2" : "mr-2"} />
                {isFavorited ? 'お気に入り済み' : 'お気に入りに追加'}
              </button>
            )}

            {/* Like Button (Others only) */}
            {currentUserId && !isOwner && onToggleLike && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleLike(idea); }}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition ${isLiked ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                <ThumbsUp size={18} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "text-indigo-500 mr-2" : "mr-2"} />
                いいね {likesCount > 0 && <span className="ml-1 px-2 py-0.5 bg-indigo-100 rounded-full text-sm">{likesCount}</span>}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* SNS Post Button (Owner only) */}
            {currentUserId && isOwner && onTogglePublic && (
              <button
                onClick={(e) => { e.stopPropagation(); onTogglePublic(idea); }}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition ${idea.isPublic ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                <Share2 size={18} className="mr-2" />
                {idea.isPublic ? '非公開にする' : 'SNSに投稿'}
              </button>
            )}

            {/* Delete Button (Owner only) */}
            {isOwner && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(idea.id); onClose(); }}
                className="flex items-center px-4 py-2 bg-white text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition"
              >
                <Trash2 size={18} className="mr-2" />
                削除
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
