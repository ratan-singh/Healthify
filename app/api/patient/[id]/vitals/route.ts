// app/api/patient/[id]/vitals/route.ts
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const filePath = path.join(process.cwd(), 'data/patients.json');
  const patients = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return NextResponse.json(patients[id]?.vitals || []);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const { heartRate, bloodPressure } = await req.json();
  const filePath = path.join(process.cwd(), 'data/patients.json');
  const patients = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const entry = { heartRate, bloodPressure, timestamp: Date.now() };
  patients[id].vitals.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(patients, null, 2));
  return NextResponse.json({ success: true });
}
