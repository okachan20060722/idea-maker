import React, { useState } from 'react';
import { IdeaCondition } from '../types';

interface InputFormProps {
  onSubmit: (condition: IdeaCondition) => void;
  isLoading: boolean;
}

export default function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [condition, setCondition] = useState<IdeaCondition>({
    purpose: '個人開発',
    field: 'AI',
    keyword: '',
    target: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCondition(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(condition);
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md border border-gray-100">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="purpose">利用目的</label>
            <select 
              id="purpose"
              name="purpose"
              value={condition.purpose} 
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="学生向け">学生向け</option>
              <option value="企業向け">企業向け</option>
              <option value="個人開発">個人開発</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="field">分野</label>
            <select 
              id="field"
              name="field"
              value={condition.field} 
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="教育">教育</option>
              <option value="AI">AI</option>
              <option value="医療">医療</option>
              <option value="エンタメ">エンタメ</option>
              <option value="SNS">SNS</option>
              <option value="環境">環境</option>
              <option value="その他">その他</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="keyword">キーワード</label>
          <input 
            type="text" 
            id="keyword"
            name="keyword"
            value={condition.keyword} 
            onChange={handleChange}
            placeholder="例: リモートワーク、自動化"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="target">ターゲット層</label>
          <input 
            type="text" 
            id="target"
            name="target"
            value={condition.target} 
            onChange={handleChange}
            placeholder="例: 20代のフリーランス"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? '生成中...' : 'アイデアを生成する'}
        </button>
      </form>
    </div>
  );
}
