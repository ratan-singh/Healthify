// app/api/patient/[id]/vitals/route.ts
import { NextResponse } from 'next/server';
import { getPatientVitals, addVital } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const vitals = await getPatientVitals(id);
    return NextResponse.json(vitals);
  } catch (error) {
    console.error('Error fetching vitals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vitals' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const { heartRate, bloodPressure } = await req.json();

    if (!heartRate || !bloodPressure) {
      return NextResponse.json(
        { error: 'Heart rate and blood pressure are required' },
        { status: 400 }
      );
    }

    await addVital(id, heartRate, bloodPressure);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding vital:', error);
    return NextResponse.json(
      { error: 'Failed to add vital' },
      { status: 500 }
    );
  }
}
