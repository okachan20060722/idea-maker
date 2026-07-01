import React, { useState, useEffect } from 'react';
import { Idea } from '../services/ideaService';
import { X, Hash, Info } from 'lucide-react';

interface PublishModalProps {
  idea: Idea | null;
  isOpen: boolean;
  onClose: () => void;
  onPublish: (ideaId: string, tags: string[], commentsEnabled: boolean) => void;
}

export default function PublishModal({ idea, isOpen, onClose, onPublish }: PublishModalProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [useAiTags, setUseAiTags] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  useEffect(() => {
    if (isOpen && idea) {
      const initialTags = idea.tags ? [...idea.tags] : [];
      setTags(initialTags);
      setUseAiTags(false);
      setCommentsEnabled(idea.commentsEnabled !== undefined ? idea.commentsEnabled : true);
      setTagInput('');
    }
  }, [isOpen, idea]);

  if (!isOpen || !idea) return null;

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleToggleAiTags = () => {
    const aiTags = idea.keywords || [];
    if (!useAiTags) {
      // Turn ON: Add AI tags that are not already in the list
      const newTags = [...tags];
      aiTags.forEach(aiTag => {
        if (!newTags.includes(aiTag)) {
          newTags.push(aiTag);
        }
      });
      setTags(newTags);
    } else {
      // Turn OFF: Remove AI tags (if they are in the list)
      setTags(tags.filter(t => !aiTags.includes(t)));
    }
    setUseAiTags(!useAiTags);
  };

  const handlePublish = () => {
    onPublish(idea.id, tags, commentsEnabled);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity">
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">SNSに公開する</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition bg-gray-50 hover:bg-gray-100 rounded-full p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-700">タグ設定</label>
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={useAiTags} onChange={handleToggleAiTags} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${useAiTags ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${useAiTags ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <span className="ml-2 text-xs text-gray-600 font-medium">AIおまかせタグ</span>
              </label>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-3 min-h-[48px] flex flex-wrap gap-2 items-center">
              {tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center text-sm px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-md">
                  <Hash size={12} className="mr-0.5" />
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-indigo-900 focus:outline-none">
                    <X size={14} />
                  </button>
                </span>
              ))}
              <input 
                type="text" 
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? "タグを入力してEnter" : ""}
                className="flex-grow bg-transparent border-none outline-none text-sm min-w-[120px] focus:ring-0 p-0"
              />
            </div>
            <p className="text-xs text-gray-500 flex items-start">
              <Info size={14} className="mr-1 flex-shrink-0 mt-0.5" />
              タグはEnterキーで追加できます。
            </p>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <div className="flex justify-between items-center">
              <div>
                <label className="block text-sm font-semibold text-gray-700">コメントを受け付ける</label>
                <p className="text-xs text-gray-500 mt-1">他のユーザーからのコメントを許可します。</p>
              </div>
              <label className="flex items-center cursor-pointer ml-4">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={commentsEnabled} onChange={() => setCommentsEnabled(!commentsEnabled)} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${commentsEnabled ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${commentsEnabled ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
          >
            キャンセル
          </button>
          <button 
            onClick={handlePublish}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
          >
            投稿する
          </button>
        </div>
      </div>
    </div>
  );
}
