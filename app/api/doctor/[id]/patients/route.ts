// app/api/doctor/[id]/patients/route.ts
import { NextResponse } from 'next/server';
import { getDoctorPatients } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const did = (await params).id;
    const patients = await getDoctorPatients(did);
    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}
