// app/api/patient/[id]/approve/route.ts
import { NextResponse } from 'next/server';
import { approveDoctor } from '@/lib/db';

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

    await approveDoctor(pid, doctorId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving doctor:', error);
    return NextResponse.json(
      { error: 'Failed to approve doctor' },
      { status: 500 }
    );
  }
}
