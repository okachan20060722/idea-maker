import { NextResponse } from 'next/server';
import { Type, Schema } from '@google/genai';
import { generateContentWithRotation } from '@/lib/geminiRotation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { purpose, field, keywords, target, grade, purposeDetail, fieldDetail, advancedConditions, sessionId } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0 || !target || !target.trim()) {
      return NextResponse.json({ error: 'キーワードとターゲット層は必須です。' }, { status: 400 });
    }

    const purposeStr = purpose === '学生' && grade && grade !== '指定なし' ? `学生（${grade}）` : purpose === 'その他' && purposeDetail ? `その他（${purposeDetail}）` : purpose;
    const fieldStr = field === 'その他' && fieldDetail ? `その他（${fieldDetail}）` : field;

    // 🔥 プロンプトを強力にアップグレード：ありきたりな回答を禁止
    const prompt = `あなたは世界を驚かせる革新的なベンチャーキャピタリスト、兼、天才アイデア創出家です。
以下の条件に基づいて、競合が一切存在しない「完全オリジナル」かつ「意外性の塊」である新しいサービスやプロダクトのアイデアを1つだけ生成してください。

【厳守すべき前提条件】
作成者（目的）: ${purposeStr}
分野: ${fieldStr}
キーワード: ${keywords.join('、')}
ターゲット層: ${target}
${advancedConditions ? `\n高度な条件・制約:\n${advancedConditions}\n` : ''}

【アイデア生成時の極秘ルール（必ず守ること）】
1. 「世の中にすでにある既存のサービス（単なるマッチングアプリ、一般的なSNS、タスク管理ツール、ありきたりなAIチャット等）」の焼き直しは、絶対に禁止します。
2. 提示された「分野」と「キーワード」を、誰も思いつかないような斜め上の角度から強制的に結合させてください。要素同士のギャップが大きければ大きいほど良いアイデアとみなします。
3. 一見すると「そんなバカな！」と思われるが、論理的に説明されると「確かにそれは未開拓のブルーオーシャンだ！」と納得できる、エッジの効いた新規性を最優先してください。
4. 生成するたびに、毎回全く異なるアプローチ、ビジネスモデル、テクノロジーの活用方法を模索してください。王道ではなく「邪道・新奇性」を攻めてください。
5. 専門用語や難解なビジネス用語、カタカナ語を多用せず、中学生でも一読して直感的にワクワクできるような、シンプルで具体的かつ明快な日本語を使ってアイデアを説明してください。

アイデアの『実現可能性（Feasibility）』を客観的に評価し、0〜100点の間でスコアを出してください。また、そのスコアをさらに向上させ、実際にプロダクトとしてスケールさせるために『まず何から始めるべきか』などの現実的なアクションプラン（改善案）をセットで提示してください。

また、生成したアイデアの内容から、検索や絞り込みに有用な特徴的な単語を3〜5個程度抽出し、配列として返してください。
出力は必ず指定されたJSONフォーマットに従ってください。`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "アイデアのタイトル（キャッチーで斬新なもの）" },
        summary: { type: Type.STRING, description: "アイデアの概要（新規性と面白さが一目で伝わる説明）" },
        target: { type: Type.STRING, description: "対象となるユーザー層の詳細と、なぜ彼らに刺さるのかの理由" },
        differentiation: { type: Type.STRING, description: "既存の類似サービスを完全に過去にする、絶対的な差別化ポイント" },
        monetization: { type: Type.STRING, description: "マネタイズ（収益化）のユニークな方法" },
        feasibilityScore: { type: Type.INTEGER, description: "アイデアの現実的な実現可能性（0〜100の数値。パーセント表示用）" },
        feasibilityActionPlan: { type: Type.STRING, description: "実現性スコアをさらに引き上げ、実際に形にするための具体的で現実的な一歩や改善案" },
        keywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "アイデアの特徴を表す検索用キーワード（3〜5個程度）"
        }
      },
      required: ["title", "summary", "target", "differentiation", "monetization", "feasibilityScore", "feasibilityActionPlan", "keywords"],
    };

    const response = await generateContentWithRotation({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        // 🔥 創造性をブーストするパラメーターを追加
        temperature: 1.2, // 1.0以上（最大2.0）に設定することで、ありきたりなトークン選択を排除
        topP: 0.95,       // 出力の多様性を確保
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