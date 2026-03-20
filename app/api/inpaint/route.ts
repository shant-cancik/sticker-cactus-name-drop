import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { image, mimeType, textToRemove, boundingBox } = await request.json();

    if (!image || !textToRemove) {
      return NextResponse.json({ error: 'Missing image or text to remove' }, { status: 400 });
    }

    // Strip data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-image-preview',
      generationConfig: {
        // @ts-expect-error - responseModalities is valid for image generation
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    // Build a precise prompt for text removal
    const regionDesc = boundingBox
      ? `The text "${textToRemove}" is located approximately ${Math.round(boundingBox.x * 100)}% from the left and ${Math.round(boundingBox.y * 100)}% from the top of the image, spanning about ${Math.round(boundingBox.width * 100)}% wide and ${Math.round(boundingBox.height * 100)}% tall.`
      : `Find the text "${textToRemove}" in the image.`;

    const prompt = `This is a sticker design. Remove ONLY the text "${textToRemove}" from this image and fill in the area naturally with the surrounding background pattern/color. ${regionDesc}

CRITICAL RULES:
- Remove ONLY the specified text "${textToRemove}" — nothing else
- Reconstruct the background behind the text seamlessly
- Keep ALL other elements (illustrations, borders, other text, logos) completely unchanged
- The result should look like the text was never there
- Maintain the exact same image dimensions and quality`;

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

    // Find the image part in the response
    for (const part of parts) {
      if (part.inlineData) {
        return NextResponse.json({
          image: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        });
      }
    }

    // If no image was returned, return the text response for debugging
    const textPart = parts.find((p: { text?: string }) => p.text);
    return NextResponse.json(
      { error: 'No image generated', details: textPart?.text || 'Unknown error' },
      { status: 500 }
    );
  } catch (error: unknown) {
    console.error('Inpaint error:', error);
    const message = error instanceof Error ? error.message : 'Inpainting failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
