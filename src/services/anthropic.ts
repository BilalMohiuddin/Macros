import { AIFoodAnalysis } from '../types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

const PROMPT = `You are a nutrition expert. Analyze this food photo and estimate the nutritional content for the visible serving size.

Respond with ONLY a valid JSON object — no markdown, no explanation, no code fences:
{
  "foodName": "descriptive name of the food",
  "calories": <integer>,
  "protein": <number with 1 decimal>,
  "carbs": <number with 1 decimal>,
  "fat": <number with 1 decimal>,
  "confidence": "high" | "medium" | "low"
}

If you cannot identify the food clearly, use your best guess and set confidence to "low".`;

export async function analyzeFoodPhoto(
  base64Image: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
  apiKey: string,
): Promise<AIFoodAnalysis> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image,
              },
            },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${error}`);
  }

  const data = await response.json() as { content: { text: string }[] };
  const content = data.content?.[0]?.text ?? '';

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in API response');

  const parsed = JSON.parse(jsonMatch[0]) as AIFoodAnalysis;

  if (
    typeof parsed.foodName !== 'string' ||
    typeof parsed.calories !== 'number' ||
    typeof parsed.protein !== 'number' ||
    typeof parsed.carbs !== 'number' ||
    typeof parsed.fat !== 'number'
  ) {
    throw new Error('Invalid response format from API');
  }

  return parsed;
}
