import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { purpose, field, keyword, target } = body;

    if (!keyword || !target || !keyword.trim() || !target.trim()) {
      return NextResponse.json({ error: 'キーワードとターゲット層は必須です。' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini APIキー (GEMINI_API_KEY) が設定されていません。.env.local ファイルを確認してください。' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `以下の条件に基づいて、新しいサービスやプロダクトのアイデアを生成してください。
目的: ${purpose}
分野: ${field}
キーワード: ${keyword}
ターゲット: ${target}

出力は必ず指定されたJSONフォーマットに従ってください。`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "アイデアのタイトル"
        },
        summary: {
          type: Type.STRING,
          description: "アイデアの概要"
        },
        target: {
          type: Type.STRING,
          description: "対象となるユーザー層の詳細"
        },
        differentiation: {
          type: Type.STRING,
          description: "既存サービスとの差別化ポイント"
        },
        monetization: {
          type: Type.STRING,
          description: "マネタイズ（収益化）の方法"
        }
      },
      required: ["title", "summary", "target", "differentiation", "monetization"],
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
    if (!text) {
      throw new Error("APIからの応答が空でした。");
    }

    const result = JSON.parse(text);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || '通信に失敗しました。時間をおいて再度お試しください。' }, { status: 500 });
  }
}
