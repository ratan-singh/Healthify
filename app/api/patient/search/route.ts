import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('id');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Read the users data file
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));

    // Search for the patient by ID (must have role 'patient')
    const patient = usersData.find((user: { id: string; role: string }) => 
      user.id === patientId && user.role === 'patient'
    );

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Return the patient data
    return NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        name: patient.name,
        role: patient.role,
        // Exclude password for security
      }
    });

  } catch (error) {
    console.error('Error searching for patient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
