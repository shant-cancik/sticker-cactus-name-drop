import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { image, mimeType } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Strip data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6-20250311',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType || 'image/png',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `You are analyzing a sticker image for a text replacement tool called "Name Drop".

Your job is to identify ALL text regions on this sticker that could be customized (location names, business names, phrases, etc.). Do NOT include small print like copyright notices, website URLs, barcodes, or "PEEL LINE" markers — only the main decorative/featured text.

For each text region, provide:
1. The exact text content
2. Its approximate bounding box as normalized coordinates (0-1 range relative to image dimensions)
3. Visual style properties

Respond ONLY with valid JSON in this exact format:
{
  "textRegions": [
    {
      "text": "ARIZONA",
      "boundingBox": {
        "x": 0.25,
        "y": 0.82,
        "width": 0.50,
        "height": 0.08
      },
      "style": {
        "fontFamily": "Impact or similar heavy sans-serif",
        "fontSize": 0.07,
        "fontWeight": "bold",
        "fontStyle": "normal",
        "color": "#1a1a1a",
        "letterSpacing": 3,
        "textTransform": "uppercase",
        "rotation": 0,
        "alignment": "center",
        "hasOutline": false,
        "outlineColor": "#000000",
        "outlineWidth": 0,
        "hasShadow": false,
        "curve": 0
      },
      "confidence": 0.95
    }
  ]
}

IMPORTANT NOTES:
- fontSize should be expressed as a fraction of the total image height (0-1 range)
- color should be the hex color of the text fill
- letterSpacing is estimated pixels at original resolution
- curve: 0 = straight, positive number = arched upward, negative = arched downward
- rotation is in degrees
- Only include text that is part of the sticker DESIGN (not metadata, not print marks)
- Be very precise about the bounding box — it should tightly contain just the text`,
            },
          ],
        },
      ],
    });

    // Extract JSON from the response
    const content = response.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response format' }, { status: 500 });
    }

    // Parse the JSON from Claude's response
    let analysis;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.text.trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      // If parsing fails, try to find JSON in the response
      const jsonStart = content.text.indexOf('{');
      const jsonEnd = content.text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        analysis = JSON.parse(content.text.substring(jsonStart, jsonEnd + 1));
      } else {
        return NextResponse.json({ error: 'Failed to parse analysis', raw: content.text }, { status: 500 });
      }
    }

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
