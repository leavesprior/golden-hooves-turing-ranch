import { NextResponse } from 'next/server';
import { dbDeleteEntry } from '@/lib/workerDb';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = dbDeleteEntry(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[worker/entries DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
