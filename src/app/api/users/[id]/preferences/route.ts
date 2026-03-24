import { NextRequest, NextResponse } from 'next/server';
import { userPreferenceRepository } from '@/lib/repositories/userPreferenceRepository';
import { auth } from '@/lib/auth';

const DEFAULTS = {
  notificationsEnabled: false,
  language: 'en',
  profilePublic: false,
  commentsEnabled: false,
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || (session.user.id !== id && session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const pref = await userPreferenceRepository.findByUserId(id);
  if (!pref) return NextResponse.json(DEFAULTS);
  return NextResponse.json(pref);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || (session.user.id !== id && session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  // Only allow the four fields
  const update: Partial<{ notificationsEnabled: boolean; language: string; profilePublic: boolean; commentsEnabled: boolean }> = {};
  if ('notificationsEnabled' in data) update.notificationsEnabled = !!data.notificationsEnabled;
  if ('language' in data) update.language = typeof data.language === 'string' ? data.language : 'en';
  if ('profilePublic' in data) update.profilePublic = !!data.profilePublic;
  if ('commentsEnabled' in data) update.commentsEnabled = !!data.commentsEnabled;
  let pref = await userPreferenceRepository.findByUserId(id);
  if (!pref) {
    pref = await userPreferenceRepository.create({ user: { connect: { id } }, ...DEFAULTS, ...update });
  } else {
    pref = await userPreferenceRepository.updateByUserId(id, update);
  }
  return NextResponse.json(pref);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Reset to defaults
  const session = await auth();
  if (!session?.user || (session.user.id !== id && session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let pref = await userPreferenceRepository.findByUserId(id);
  if (!pref) {
    pref = await userPreferenceRepository.create({ user: { connect: { id } }, ...DEFAULTS });
  } else {
    pref = await userPreferenceRepository.updateByUserId(id, DEFAULTS);
  }
  return NextResponse.json(pref);
} 