import React from 'react';
import { IdeaResult } from '../types';
import { Bookmark, BookmarkCheck, Heart } from 'lucide-react';

interface ResultCardProps {
  result: IdeaResult | null;
  onSave?: () => void;
  onTogglePublic?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
  isPublic?: boolean;
  isAuthenticated?: boolean;
  autoSaved?: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  onToggleSave?: (e: React.MouseEvent) => void;
}

export default function ResultCard({ 
  result, 
  onSave, 
  onTogglePublic,
  isSaving, 
  isSaved, 
  isPublic,
  isAuthenticated,
  autoSaved,
  isFavorited,
  onToggleFavorite,
  onToggleSave
}: ResultCardProps) {
  if (!result) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-8 border border-gray-200">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold flex items-center">
          <span className="mr-2" role="img" aria-label="sparkles">✨</span>
          生成されたアイデア
        </h2>
        
        <div className="flex space-x-3">
          {autoSaved && onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition ${isFavorited ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
            >
              <Heart size={18} fill={isFavorited ? "currentColor" : "none"} className={isFavorited ? "text-red-500 mr-2" : "mr-2"} />
              {isFavorited ? 'お気に入り済み' : 'お気に入りに追加'}
            </button>
          )}
          
          {onTogglePublic && (
            <button
              onClick={onTogglePublic}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition ${isPublic ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
            >
              {isPublic ? 'SNS公開中' : 'SNSに投稿'}
            </button>
          )}
          
          {!autoSaved && onSave && (
            <button
              onClick={(e) => {
                if (onToggleSave) onToggleSave(e);
                else onSave();
              }}
              disabled={isSaving}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition ${isSaved ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-blue-600 text-white hover:bg-blue-700'} disabled:opacity-50`}
            >
              <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} className={isSaved ? "text-blue-500 mr-2" : "mr-2"} />
              {isSaved ? '保存済み' : isSaving ? '保存中...' : 'マイページに保存'}
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-1">アイデア名</h3>
          <p className="text-xl font-bold text-gray-900">{result.name}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-1">概要</h3>
          <p className="text-gray-800 leading-relaxed">{result.summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">想定ユーザー</h3>
            <p className="text-gray-800">{result.targetUser}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">差別化ポイント</h3>
            <p className="text-gray-800">{result.differentiation}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-1">収益化案</h3>
          <p className="text-gray-800 bg-blue-50 p-4 rounded-md border border-blue-100">{result.monetization}</p>
        </div>

        {result.feasibilityScore !== undefined && result.feasibilityActionPlan && (
          <div className="mt-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2" role="img" aria-label="rocket">🚀</span>
              実現性スコアと詳細解説
            </h3>
            
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-5 rounded-lg border border-indigo-100 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 bg-white p-3 rounded-full shadow-sm border border-indigo-100 mr-4">
                  <div className="text-center">
                    <span className="block text-xs font-semibold text-indigo-500 uppercase tracking-wider">実現性スコア</span>
                    <span className="block text-2xl font-extrabold text-indigo-700">{result.feasibilityScore}<span className="text-lg text-indigo-500">%</span></span>
                  </div>
                </div>
                <div className="w-full bg-white rounded-full h-3 border border-indigo-100 overflow-hidden">
                  <div 
                    className={`h-full ${result.feasibilityScore >= 80 ? 'bg-green-500' : result.feasibilityScore >= 50 ? 'bg-indigo-500' : 'bg-yellow-500'} transition-all duration-1000 ease-out`}
                    style={{ width: `${result.feasibilityScore}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-indigo-800 mb-2">スコアの理由と実現への具体案</h4>
                <p className="text-gray-800 leading-relaxed bg-white p-4 rounded-md shadow-sm border border-indigo-50">{result.feasibilityActionPlan}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
