// app/api/patient/[id]/approve/route.ts
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const pid = (await params).id;
  const { doctorId } = await req.json();
  const patientsPath = path.join(process.cwd(), 'data/patients.json');
  const doctorsPath = path.join(process.cwd(), 'data/doctors.json');
  const patients = JSON.parse(fs.readFileSync(patientsPath, 'utf8'));
  const doctors = JSON.parse(fs.readFileSync(doctorsPath, 'utf8'));

  patients[pid].pendingRequests = patients[pid].pendingRequests.filter((d: string) => d !== doctorId);
  if (!patients[pid].approvedDoctors.includes(doctorId)) {
    patients[pid].approvedDoctors.push(doctorId);
  }
  if (!doctors[doctorId].patients.includes(pid)) {
    doctors[doctorId].patients.push(pid);
  }

  fs.writeFileSync(patientsPath, JSON.stringify(patients, null, 2));
  fs.writeFileSync(doctorsPath, JSON.stringify(doctors, null, 2));
  return NextResponse.json({ success: true });
}
