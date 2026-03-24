import { NextRequest, NextResponse } from 'next/server';
import ModelClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import { siteSettingsRepository } from '@/lib/repositories/siteSettingsRepository';
import * as z from "zod"

const endpoint = 'https://models.github.ai/inference';
const model = 'openai/gpt-4.1';

const aiRecommendationSchema = z.object({
  content: z.string().min(1).max(10000)
})

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();
    const parsed = aiRecommendationSchema.safeParse({ content });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 });
    }

    // Fetch the AI key from the most recent SiteSettings
    const settings = await siteSettingsRepository.findFirst({ orderBy: { updatedAt: 'desc' } });
    const token = settings?.aiKey;
    if (!token) {
      return NextResponse.json({ error: 'AI integration key not set in settings.' }, { status: 500 });
    }

    const client = ModelClient(
      endpoint,
      new AzureKeyCredential(token),
    );

    const response = await client.path('/chat/completions').post({
      body: {
        messages: [
          { role: 'system', content: 'You are a helpful writing assistant. Suggest improvements, clarity, and style enhancements for the following blog post content. Respond with clear, actionable recommendations.' },
          { role: 'user', content },
        ],
        temperature: 0.7,
        top_p: 1.0,
        model,
      },
    });

    if (isUnexpected(response)) {
      return NextResponse.json({ error: response.body.error }, { status: 500 });
    }

    const recommendations = response.body.choices?.[0]?.message?.content || '';
    return NextResponse.json({ recommendations });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      return NextResponse.json({ error: (err as { message?: string }).message || 'Unknown error' }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
} 