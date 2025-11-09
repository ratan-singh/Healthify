// app/api/patient/[id]/diagnosis/route.ts
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const pid = (await params).id;
  const patients = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/patients.json'), 'utf8'));
  return NextResponse.json(patients[pid]?.diagnoses || []);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const pid = (await params).id;
  const { doctorId, notes, prescription } = await req.json();
  const patientsPath = path.join(process.cwd(), 'data/patients.json');
  const patients = JSON.parse(fs.readFileSync(patientsPath, 'utf8'));
  // Check access
  if (!patients[pid].approvedDoctors.includes(doctorId)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  // Add new diagnosis entry
  patients[pid].diagnoses.push({
    doctorId, notes, prescription, timestamp: Date.now()
  });
  fs.writeFileSync(patientsPath, JSON.stringify(patients, null, 2));
  return NextResponse.json({ success: true });
}
