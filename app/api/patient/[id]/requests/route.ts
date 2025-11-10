// app/api/patient/[id]/requests/route.ts
import { NextResponse } from 'next/server';
import { getPendingRequests, addAccessRequest } from '@/lib/db';

// Pending doctor requests for a patient
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const requests = await getPendingRequests(id);
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending requests' },
      { status: 500 }
    );
  }
}

// Send a request to approve a doctor
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const { doctorId } = await req.json();

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    await addAccessRequest(id, doctorId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding access request:', error);
    return NextResponse.json(
      { error: 'Failed to add access request' },
      { status: 500 }
    );
  }
}
