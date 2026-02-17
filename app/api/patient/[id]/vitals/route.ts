// app/api/patient/[id]/vitals/route.ts
import { NextResponse } from 'next/server';
import { getPatientVitals, addVital } from '@/lib/db';

interface VitalRow {
  heart_rate: string;
  blood_pressure: string;
  timestamp: string | number;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const vitals = await getPatientVitals(id);
    
    // Transform snake_case to camelCase and convert timestamp to number
    const formattedVitals = vitals.map((vital: VitalRow) => ({
      heartRate: vital.heart_rate,
      bloodPressure: vital.blood_pressure,
      timestamp: Number(vital.timestamp)
    }));
    
    return NextResponse.json(formattedVitals);
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
