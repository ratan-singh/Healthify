// app/api/patient/[id]/revoke/route.ts
import { NextResponse } from 'next/server';
import { revokeDoctor } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pid = (await params).id;
    const { doctorId } = await req.json();

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    await revokeDoctor(pid, doctorId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking doctor:', error);
    return NextResponse.json(
      { error: 'Failed to revoke doctor' },
      { status: 500 }
    );
  }
}
