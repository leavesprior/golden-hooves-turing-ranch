import { NextResponse } from 'next/server';
import { dbGetAllEntries, dbCreateEntry } from '@/lib/workerDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const entries = dbGetAllEntries();
    return NextResponse.json({ entries });
  } catch (err) {
    console.error('[worker/entries GET]', err);
    return NextResponse.json({ error: 'Failed to load entries' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, date, hours, description, condition, applies_to, rate, rent_value, cash_value, worker_name } = body;

    if (!id || !date || !hours || !description || !applies_to || rate === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (hours <= 0 || hours > 24) {
      return NextResponse.json({ error: 'Hours must be between 0.25 and 24' }, { status: 400 });
    }

    const entry = dbCreateEntry({
      id, date,
      hours: Number(hours),
      description: String(description).trim(),
      condition: condition || 'regular',
      applies_to,
      rate: Number(rate),
      rent_value: Number(rent_value || 0),
      cash_value: Number(cash_value || 0),
      worker_name: worker_name || 'Mike Fisher',
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    console.error('[worker/entries POST]', err);
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 });
  }
}
