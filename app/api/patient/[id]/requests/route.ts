// app/api/patient/[id]/requests/route.ts
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

// Pending doctor requests for a patient
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const patients = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/patients.json'), 'utf8'));
  return NextResponse.json(patients[id]?.pendingRequests || []);
}

// Send a request to approve a doctor
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const { doctorId } = await req.json();
  const patientsPath = path.join(process.cwd(), 'data/patients.json');
  const patients = JSON.parse(fs.readFileSync(patientsPath, 'utf8'));
  // Avoid duplicates
  if (!patients[id].pendingRequests.includes(doctorId) && !patients[id].approvedDoctors.includes(doctorId)) {
    patients[id].pendingRequests.push(doctorId);
    fs.writeFileSync(patientsPath, JSON.stringify(patients, null, 2));
  }
  return NextResponse.json({ success: true });
}
