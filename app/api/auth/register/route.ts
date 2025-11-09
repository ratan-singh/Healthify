import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  const { name, password, role } = await req.json();
  const dataDir = path.join(process.cwd(), 'data');
  const usersPath = path.join(dataDir, 'users.json');
  const patientsPath = path.join(dataDir, 'patients.json');
  const doctorsPath = path.join(dataDir, 'doctors.json');
  

  const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const id = uuidv4();
  usersData.push({ id, name, password, role });
  fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));
  
  if (role === 'patient') {
    const patientsData = JSON.parse(fs.readFileSync(patientsPath, 'utf8'));
    patientsData[id] = { vitals: [], pendingRequests: [], approvedDoctors: [], diagnoses: [] };
    fs.writeFileSync(patientsPath, JSON.stringify(patientsData, null, 2));
  } else if (role === 'doctor') {
    const doctorsData = JSON.parse(fs.readFileSync(doctorsPath, 'utf8'));
    doctorsData[id] = { patients: [] };
    fs.writeFileSync(doctorsPath, JSON.stringify(doctorsData, null, 2));
  }

  return NextResponse.json({ message: 'Registered' });
}
