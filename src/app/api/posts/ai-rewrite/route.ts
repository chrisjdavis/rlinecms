import { NextRequest, NextResponse } from 'next/server';
import ModelClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import { siteSettingsRepository } from '@/lib/repositories/siteSettingsRepository';
import * as z from "zod"

const endpoint = 'https://models.github.ai/inference';
const model = 'openai/gpt-4.1';

const aiRewriteSchema = z.object({
  content: z.string().min(1).max(10000),
  suggestions: z.string().min(1).max(10000)
})

export async function POST(req: NextRequest) {
  try {
    const { content, suggestions } = await req.json();
    const parsed = aiRewriteSchema.safeParse({ content, suggestions });
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

    const prompt = `You are an expert blog editor. Here is the original post content:\n\n${content}\n\nHere are the accepted suggestions for improvement:\n\n${suggestions}\n\nRewrite the post content, applying the suggestions above. Return only the improved post content, in markdown format.`;

    const response = await client.path('/chat/completions').post({
      body: {
        messages: [
          { role: 'system', content: 'You are a helpful assistant for rewriting blog posts.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        top_p: 1.0,
        model,
      },
    });

    if (isUnexpected(response)) {
      return NextResponse.json({ error: response.body.error }, { status: 500 });
    }

    const rewrittenContent = response.body.choices?.[0]?.message?.content?.trim() || '';
    return NextResponse.json({ rewrittenContent });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      return NextResponse.json({ error: (err as { message?: string }).message || 'Unknown error' }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
} 