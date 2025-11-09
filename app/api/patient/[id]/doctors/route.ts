// app/api/patient/[id]/doctors/route.ts
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
// Approved doctors for a patient
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const pid = (await params).id;
  const patients = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/patients.json'), 'utf8'));
  const users = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/users.json'), 'utf8'));
  const doctorIds = patients[pid]?.approvedDoctors || [];
  
  const doctors = users
    .filter((u) => doctorIds.includes(u.id))
    .map((u) => ({ id: u.id, name: u.name }));
  return NextResponse.json(doctors);
}
