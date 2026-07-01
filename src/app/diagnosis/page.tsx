import Link from 'next/link';
import { ClipboardList, MessageSquareText, Compass } from 'lucide-react';

export default function DiagnosisDashboard() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12 text-center">
      <header className="mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-teal-50 rounded-full mb-6 text-teal-600 shadow-sm">
          <Compass size={40} />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">方向性診断</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          あなたに最適なアイデアの方向性を見つけるための2つの診断コースをご用意しています。
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Link href="/diagnosis/simple" className="group text-left bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-teal-200 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <ClipboardList size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">簡易診断</h2>
            <p className="text-gray-600 mb-6 min-h-[48px]">
              いくつかの簡単な質問に選択式で答えるだけで、すぐにおすすめの方向性がわかります。
            </p>
            <div className="text-teal-600 font-semibold flex items-center group-hover:translate-x-2 transition-transform">
              診断を始める <span className="ml-2">→</span>
            </div>
          </div>
        </Link>

        <Link href="/diagnosis/ai" className="group text-left bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <MessageSquareText size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">AI診断</h2>
            <p className="text-gray-600 mb-6 min-h-[48px]">
              AIとチャット形式で対話しながら、より深くあなたの強みや希望を掘り下げて診断します。
            </p>
            <div className="text-indigo-600 font-semibold flex items-center group-hover:translate-x-2 transition-transform">
              AIと対話する <span className="ml-2">→</span>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}
