// app/api/doctor/[id]/patients/route.ts
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const did = (await params).id;
  console.log("Doctor ID:", did);
  const doctors = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/doctors.json'), 'utf8'));
  const users = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/users.json'), 'utf8'));
  const patientIds = doctors[did]?.patients || [];
  // Map to user info
  const patients = users
    .filter((u) => patientIds.includes(u.id))
    .map((u) => ({ id: u.id, name: u.name }));
    console.log(patients);
  return NextResponse.json(patients);
}
