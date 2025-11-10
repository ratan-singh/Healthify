// app/api/patient/[id]/doctors/route.ts
import { NextResponse } from 'next/server';
import { getApprovedDoctors } from '@/lib/db';

// Approved doctors for a patient
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pid = (await params).id;
    const doctors = await getApprovedDoctors(pid);
    return NextResponse.json(doctors);
  } catch (error) {
    console.error('Error fetching approved doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approved doctors' },
      { status: 500 }
    );
  }
}
