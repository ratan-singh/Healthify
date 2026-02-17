import { NextRequest, NextResponse } from 'next/server';
import { storeEcgData, getEcgDataByDevice } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming JSON data
    const data = await request.json();

    // Validate required fields
    const { device_id, timestamp, sampling_rate, ecg_samples } = data;

    if (!device_id) {
      return NextResponse.json(
        { error: 'device_id is required' },
        { status: 400 }
      );
    }

    if (!timestamp) {
      return NextResponse.json(
        { error: 'timestamp is required' },
        { status: 400 }
      );
    }

    if (!sampling_rate || typeof sampling_rate !== 'number') {
      return NextResponse.json(
        { error: 'sampling_rate must be a number' },
        { status: 400 }
      );
    }

    if (!ecg_samples || !Array.isArray(ecg_samples)) {
      return NextResponse.json(
        { error: 'ecg_samples must be an array' },
        { status: 400 }
      );
    }

    // Store the ECG data in the database
    const result = await storeEcgData(
      device_id,
      timestamp,
      sampling_rate,
      ecg_samples
    );

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'ECG data stored successfully',
        data: {
          id: result.id,
          device_id: result.device_id,
          timestamp: result.timestamp,
          sampling_rate: result.sampling_rate,
          samples_count: ecg_samples.length,
          created_at: result.created_at
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error storing ECG data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to store ECG data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get device_id from query parameters
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('device_id');
    const limit = Number.parseInt(searchParams.get('limit') || '100');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'device_id query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch ECG data from database
    const ecgData = await getEcgDataByDevice(deviceId, limit);

    return NextResponse.json(
      {
        success: true,
        count: ecgData.length,
        data: ecgData
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching ECG data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch ECG data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
