import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, action } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'チャット履歴が必要です。' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini APIキーが設定されていません。' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // フォーマットチャット履歴
    const formattedHistory = messages.map((m: any) => `${m.role === 'ai' ? 'AI' : 'ユーザー'}: ${m.content}`).join('\n\n');

    if (action === 'next_question') {
      const prompt = `あなたは「起業・副業アイデアの方向性診断AI」です。
以下のユーザーとの対話履歴を踏まえて、ユーザーの強みや興味をさらに深堀りし、最適なアイデアを見つけるための「次の質問」を1つだけ投げかけてください。

制約事項:
- 質問は1つだけにしてください。
- 丁寧なトーンで、ユーザーが答えやすい質問にしてください。
- 挨拶などは省略して構いません。

対話履歴:
${formattedHistory}

次の質問:`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const replyText = response.text;
      return NextResponse.json({ reply: replyText });
    } 
    
    if (action === 'diagnose') {
      const prompt = `あなたは「起業・副業アイデアの方向性診断AI」です。
以下のユーザーとの対話履歴を分析し、最適なアイデアの方向性（診断結果）と、具体的なおすすめアイデアを1つ提案してください。

対話履歴:
${formattedHistory}

出力は必ず以下のJSONフォーマットに従ってください。`;

      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          diagnosis: {
            type: Type.STRING,
            description: "これまでの対話履歴から分析した、ユーザーの強みや方向性の解説（200〜300文字程度）"
          },
          idea: {
            type: Type.OBJECT,
            description: "おすすめのアイデア案",
            properties: {
              title: { type: Type.STRING, description: "アイデアのタイトル" },
              summary: { type: Type.STRING, description: "アイデアの概要" },
              target: { type: Type.STRING, description: "対象となるユーザー層の詳細" },
              differentiation: { type: Type.STRING, description: "既存サービスとの差別化ポイント" },
              monetization: { type: Type.STRING, description: "マネタイズ（収益化）の方法" }
            },
            required: ["title", "summary", "target", "differentiation", "monetization"],
          }
        },
        required: ["diagnosis", "idea"],
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });

      const text = response.text;
      if (!text) throw new Error("APIからの応答が空でした。");

      const result = JSON.parse(text);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: '無効なアクションです。' }, { status: 400 });

  } catch (error: any) {
    console.error("Diagnosis Chat API Error:", error);
    return NextResponse.json({ error: error.message || '通信に失敗しました。時間をおいて再度お試しください。' }, { status: 500 });
  }
}
