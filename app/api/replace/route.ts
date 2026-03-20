import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { image, mimeType, originalText, newText, style } = await request.json();

    if (!image || !originalText || !newText) {
      return NextResponse.json(
        { error: 'Missing required fields: image, originalText, newText' },
        { status: 400 }
      );
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-image-preview',
      generationConfig: {
        // @ts-expect-error - responseModalities is valid for image generation
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    // Build style description for accurate replacement
    const styleDesc = style
      ? `The text style should match: ${style.fontWeight || 'bold'} ${style.fontFamily || 'sans-serif'} font, color ${style.color || 'dark'}, ${style.textTransform === 'uppercase' ? 'ALL UPPERCASE' : 'as written'}, ${style.letterSpacing ? `with ${style.letterSpacing}px letter spacing` : ''}, ${style.hasOutline ? `with ${style.outlineColor} outline` : 'no outline'}, ${style.curve ? 'slightly curved/arched' : 'straight horizontal'}.`
      : 'Match the exact same font style, size, color, weight, and positioning as the original text.';

    const prompt = `This is a sticker design. Replace ONLY the text "${originalText}" with "${newText}" in this image.

CRITICAL RULES:
- Replace ONLY "${originalText}" with "${newText}" — change absolutely nothing else
- The new text "${newText}" MUST use the EXACT same font style, size, weight, color, and positioning as the original text "${originalText}"
- ${styleDesc}
- Keep the same text alignment and centering
- If the new text is longer or shorter, adjust letter spacing slightly to fit naturally in the same space
- ALL other elements must remain 100% identical (illustrations, borders, backgrounds, other text, logos)
- Maintain the exact same image dimensions, resolution, and quality
- The result should look like a professionally produced sticker with "${newText}" instead of "${originalText}"`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType || 'image/png',
          data: base64Data,
        },
      },
      prompt,
    ]);

    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts;

    if (!parts) {
      return NextResponse.json({ error: 'No response from Gemini' }, { status: 500 });
    }

    for (const part of parts) {
      if (part.inlineData) {
        return NextResponse.json({
          image: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        });
      }
    }

    const textPart = parts.find((p: { text?: string }) => p.text);
    return NextResponse.json(
      { error: 'No image generated', details: textPart?.text || 'Unknown error' },
      { status: 500 }
    );
  } catch (error: unknown) {
    console.error('Replace error:', error);
    const message = error instanceof Error ? error.message : 'Text replacement failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
