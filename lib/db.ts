import { sql } from '@vercel/postgres';

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('patient', 'doctor')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create vitals table
    await sql`
      CREATE TABLE IF NOT EXISTS vitals (
        id SERIAL PRIMARY KEY,
        patient_id TEXT NOT NULL REFERENCES users(id),
        heart_rate TEXT NOT NULL,
        blood_pressure TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create diagnoses table
    await sql`
      CREATE TABLE IF NOT EXISTS diagnoses (
        id SERIAL PRIMARY KEY,
        patient_id TEXT NOT NULL REFERENCES users(id),
        doctor_id TEXT NOT NULL REFERENCES users(id),
        condition TEXT,
        notes TEXT NOT NULL,
        prescription TEXT,
        date BIGINT NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create patient_doctors table (for approved access)
    await sql`
      CREATE TABLE IF NOT EXISTS patient_doctors (
        id SERIAL PRIMARY KEY,
        patient_id TEXT NOT NULL REFERENCES users(id),
        doctor_id TEXT NOT NULL REFERENCES users(id),
        approved BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(patient_id, doctor_id)
      )
    `;

    // Create access_requests table (pending requests)
    await sql`
      CREATE TABLE IF NOT EXISTS access_requests (
        id SERIAL PRIMARY KEY,
        patient_id TEXT NOT NULL REFERENCES users(id),
        doctor_id TEXT NOT NULL REFERENCES users(id),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(patient_id, doctor_id)
      )
    `;

    // Create ecg_data table
    await sql`
      CREATE TABLE IF NOT EXISTS ecg_data (
        id SERIAL PRIMARY KEY,
        device_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        sampling_rate INTEGER NOT NULL,
        ecg_samples JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create index for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_ecg_device_timestamp 
      ON ecg_data(device_id, timestamp)
    `;

    console.log('Database tables initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Helper function to get user by email
export async function getUserByEmail(email: string) {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `;
  return result.rows[0] || null;
}

// Helper function to get user by id
export async function getUserById(id: string) {
  const result = await sql`
    SELECT * FROM users WHERE id = ${id} LIMIT 1
  `;
  return result.rows[0] || null;
}

// Helper function to create user
export async function createUser(id: string, name: string, email: string, password: string, role: string) {
  const result = await sql`
    INSERT INTO users (id, name, email, password, role)
    VALUES (${id}, ${name}, ${email}, ${password}, ${role})
    RETURNING *
  `;
  return result.rows[0];
}

// Helper function to get all patients (users with role='patient')
export async function getAllPatients() {
  const result = await sql`
    SELECT id, name, email, role FROM users WHERE role = 'patient'
  `;
  return result.rows;
}

// Helper function to get patient vitals
export async function getPatientVitals(patientId: string) {
  const result = await sql`
    SELECT heart_rate, blood_pressure, timestamp
    FROM vitals
    WHERE patient_id = ${patientId}
    ORDER BY timestamp ASC
  `;
  return result.rows;
}

// Helper function to add vital
export async function addVital(patientId: string, heartRate: string, bloodPressure: string) {
  const timestamp = Date.now();
  const result = await sql`
    INSERT INTO vitals (patient_id, heart_rate, blood_pressure, timestamp)
    VALUES (${patientId}, ${heartRate}, ${bloodPressure}, ${timestamp})
    RETURNING *
  `;
  return result.rows[0];
}

// Helper function to get patient diagnoses
export async function getPatientDiagnoses(patientId: string) {
  const result = await sql`
    SELECT doctor_id, condition, notes, prescription, date, timestamp
    FROM diagnoses
    WHERE patient_id = ${patientId}
    ORDER BY timestamp DESC
  `;
  return result.rows;
}

// Helper function to add diagnosis
export async function addDiagnosis(
  patientId: string,
  doctorId: string,
  notes: string,
  prescription: string,
  condition?: string
) {
  const timestamp = Date.now();
  const result = await sql`
    INSERT INTO diagnoses (patient_id, doctor_id, condition, notes, prescription, date, timestamp)
    VALUES (${patientId}, ${doctorId}, ${condition || ''}, ${notes}, ${prescription}, ${timestamp}, ${timestamp})
    RETURNING *
  `;
  return result.rows[0];
}

// Helper function to get approved doctors for a patient
export async function getApprovedDoctors(patientId: string) {
  const result = await sql`
    SELECT u.id, u.name, u.email
    FROM patient_doctors pd
    JOIN users u ON pd.doctor_id = u.id
    WHERE pd.patient_id = ${patientId} AND pd.approved = true
  `;
  return result.rows;
}

// Helper function to get patients for a doctor
export async function getDoctorPatients(doctorId: string) {
  const result = await sql`
    SELECT u.id, u.name, u.email
    FROM patient_doctors pd
    JOIN users u ON pd.patient_id = u.id
    WHERE pd.doctor_id = ${doctorId} AND pd.approved = true
  `;
  return result.rows;
}

// Helper function to get pending requests for a patient
export async function getPendingRequests(patientId: string) {
  const result = await sql`
    SELECT doctor_id
    FROM access_requests
    WHERE patient_id = ${patientId} AND status = 'pending'
  `;
  return result.rows.map(row => row.doctor_id);
}

// Helper function to add access request
export async function addAccessRequest(patientId: string, doctorId: string) {
  try {
    const result = await sql`
      INSERT INTO access_requests (patient_id, doctor_id, status)
      VALUES (${patientId}, ${doctorId}, 'pending')
      ON CONFLICT (patient_id, doctor_id) DO NOTHING
      RETURNING *
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error adding access request:', error);
    return null;
  }
}

// Helper function to approve doctor access
export async function approveDoctor(patientId: string, doctorId: string) {
  try {
    // Update request status to approved
    await sql`
      UPDATE access_requests
      SET status = 'approved'
      WHERE patient_id = ${patientId} AND doctor_id = ${doctorId}
    `;

    // Add to patient_doctors table
    const result = await sql`
      INSERT INTO patient_doctors (patient_id, doctor_id, approved)
      VALUES (${patientId}, ${doctorId}, true)
      ON CONFLICT (patient_id, doctor_id) DO UPDATE SET approved = true
      RETURNING *
    `;

    return result.rows[0];
  } catch (error) {
    console.error('Error approving doctor:', error);
    throw error;
  }
}

// Helper function to revoke doctor access
export async function revokeDoctor(patientId: string, doctorId: string) {
  try {
    await sql`
      DELETE FROM patient_doctors
      WHERE patient_id = ${patientId} AND doctor_id = ${doctorId}
    `;
    return { success: true };
  } catch (error) {
    console.error('Error revoking doctor:', error);
    throw error;
  }
}

// Helper function to store ECG data
export async function storeEcgData(
  deviceId: string,
  timestamp: string,
  samplingRate: number,
  ecgSamples: number[]
) {
  try {
    const result = await sql`
      INSERT INTO ecg_data (device_id, timestamp, sampling_rate, ecg_samples)
      VALUES (${deviceId}, ${timestamp}, ${samplingRate}, ${JSON.stringify(ecgSamples)})
      RETURNING id, device_id, timestamp, sampling_rate, created_at
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error storing ECG data:', error);
    throw error;
  }
}

// Helper function to get ECG data by device
export async function getEcgDataByDevice(deviceId: string, limit: number = 100) {
  try {
    const result = await sql`
      SELECT id, device_id, timestamp, sampling_rate, ecg_samples, created_at
      FROM ecg_data
      WHERE device_id = ${deviceId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  } catch (error) {
    console.error('Error fetching ECG data:', error);
    throw error;
  }
}
