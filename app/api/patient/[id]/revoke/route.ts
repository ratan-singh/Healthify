// app/api/patient/[id]/revoke/route.ts
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

  // Remove doctor access
  patients[pid].approvedDoctors = patients[pid].approvedDoctors.filter((d: string) => d !== doctorId);
  doctors[doctorId].patients = doctors[doctorId].patients.filter((p: string) => p !== pid);

  fs.writeFileSync(patientsPath, JSON.stringify(patients, null, 2));
  fs.writeFileSync(doctorsPath, JSON.stringify(doctors, null, 2));
  return NextResponse.json({ success: true });
}
