// app/api/patient/[id]/diagnosis/route.ts
import { NextResponse } from 'next/server';
import { getPatientDiagnoses, addDiagnosis, getApprovedDoctors } from '@/lib/db';

interface DiagnosisRow {
  doctor_id: string;
  condition: string;
  notes: string;
  prescription: string;
  date: string | number;
  timestamp: string | number;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pid = (await params).id;
    const diagnoses = await getPatientDiagnoses(pid);
    
    // Transform snake_case to camelCase
    const formattedDiagnoses = diagnoses.map((diagnosis: DiagnosisRow) => ({
      doctorId: diagnosis.doctor_id,
      condition: diagnosis.condition,
      notes: diagnosis.notes,
      prescription: diagnosis.prescription,
      date: Number(diagnosis.date),
      timestamp: Number(diagnosis.timestamp)
    }));
    
    return NextResponse.json(formattedDiagnoses);
  } catch (error) {
    console.error('Error fetching diagnoses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diagnoses' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pid = (await params).id;
    const { doctorId, notes, prescription } = await req.json();

    if (!doctorId || !notes) {
      return NextResponse.json(
        { error: 'Doctor ID and notes are required' },
        { status: 400 }
      );
    }

    // Check if doctor has access
    const approvedDoctors = await getApprovedDoctors(pid);
    const hasAccess = approvedDoctors.some(doc => doc.id === doctorId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Add new diagnosis entry
    await addDiagnosis(pid, doctorId, notes, prescription || '');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding diagnosis:', error);
    return NextResponse.json(
      { error: 'Failed to add diagnosis' },
      { status: 500 }
    );
  }
}
