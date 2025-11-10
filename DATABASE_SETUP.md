# Healthify - Database Migration Guide

## Vercel Postgres Setup

This project has been migrated from JSON file storage to Vercel Postgres to support deployment on Vercel's serverless environment.

### Prerequisites

1. A Vercel account
2. Your project deployed or linked to Vercel

### Step 1: Create Postgres Database on Vercel

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your Healthify project
3. Navigate to the "Storage" tab
4. Click "Create Database"
5. Select "Postgres"
6. Choose a name for your database (e.g., `healthify-db`)
7. Select a region close to your users
8. Click "Create"

### Step 2: Configure Environment Variables

Vercel will automatically add the following environment variables to your project:

- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

These are automatically injected, so you don't need to manually configure them.

### Step 3: Initialize the Database

After deploying your application to Vercel:

1. Visit: `https://your-app-url.vercel.app/api/init-db`
2. This will create all necessary tables:
   - `users` - User authentication and profiles
   - `vitals` - Patient vital signs
   - `diagnoses` - Medical diagnoses
   - `patient_doctors` - Approved doctor-patient relationships
   - `access_requests` - Pending access requests

You should see a success message: `{"success":true,"message":"Database initialized successfully"}`

### Step 4: Test Your Application

1. Go to your registration page: `https://your-app-url.vercel.app/register`
2. Create a new patient account
3. Create a doctor account
4. Test the functionality:
   - Login as patient
   - Add vitals
   - Login as doctor
   - Search for patient
   - Send access request
   - Login as patient again
   - Approve the request
   - Check that doctor can now see patient data

## Local Development with Vercel Postgres

To develop locally with Vercel Postgres:

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Link your project:
   ```bash
   vercel link
   ```

3. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```

4. Run your development server:
   ```bash
   npm run dev
   ```

5. Initialize the database locally:
   Visit: `http://localhost:3000/api/init-db`

## Database Schema

### users
- `id` (TEXT, PRIMARY KEY) - Unique user identifier
- `name` (TEXT) - User's full name
- `email` (TEXT, UNIQUE) - User's email address
- `password` (TEXT) - User's password (should be hashed in production)
- `role` (TEXT) - Either 'patient' or 'doctor'
- `created_at` (TIMESTAMP) - Account creation date

### vitals
- `id` (SERIAL, PRIMARY KEY)
- `patient_id` (TEXT, FOREIGN KEY → users.id)
- `heart_rate` (TEXT)
- `blood_pressure` (TEXT)
- `timestamp` (BIGINT) - When the vital was recorded
- `created_at` (TIMESTAMP)

### diagnoses
- `id` (SERIAL, PRIMARY KEY)
- `patient_id` (TEXT, FOREIGN KEY → users.id)
- `doctor_id` (TEXT, FOREIGN KEY → users.id)
- `condition` (TEXT)
- `notes` (TEXT)
- `prescription` (TEXT)
- `date` (BIGINT)
- `timestamp` (BIGINT)
- `created_at` (TIMESTAMP)

### patient_doctors
- `id` (SERIAL, PRIMARY KEY)
- `patient_id` (TEXT, FOREIGN KEY → users.id)
- `doctor_id` (TEXT, FOREIGN KEY → users.id)
- `approved` (BOOLEAN) - Access status
- `created_at` (TIMESTAMP)
- UNIQUE constraint on (patient_id, doctor_id)

### access_requests
- `id` (SERIAL, PRIMARY KEY)
- `patient_id` (TEXT, FOREIGN KEY → users.id)
- `doctor_id` (TEXT, FOREIGN KEY → users.id)
- `status` (TEXT) - 'pending', 'approved', or 'denied'
- `created_at` (TIMESTAMP)
- UNIQUE constraint on (patient_id, doctor_id)

## Migrating Existing JSON Data (Optional)

If you have existing data in JSON files that you want to migrate:

1. Create a migration script (example in `scripts/migrate-data.ts`)
2. Read the JSON files
3. Insert data into Postgres using the helper functions in `lib/db.ts`

Example migration code:

```typescript
import { createUser, addVital, addDiagnosis } from '@/lib/db';
import usersData from '../data/users.json';
import patientsData from '../data/patients.json';

async function migrate() {
  // Migrate users
  for (const user of usersData) {
    await createUser(user.id, user.name, user.email, user.password, user.role);
  }
  
  // Migrate patient vitals
  for (const [patientId, data] of Object.entries(patientsData)) {
    for (const vital of data.vitals) {
      await addVital(patientId, vital.heartRate, vital.bloodPressure);
    }
  }
}

migrate().catch(console.error);
```

## Troubleshooting

### Error: "relation does not exist"
Solution: Make sure you've visited `/api/init-db` to create the tables.

### Error: "connection refused"
Solution: Check that your environment variables are properly set. Run `vercel env pull .env.local` to update them.

### Error: "EROFS: read-only file system"
Solution: This means you're still using JSON files. Make sure all API routes are updated to use the database functions from `lib/db.ts`.

## Security Recommendations for Production

1. **Hash passwords**: Use bcrypt or argon2 to hash passwords before storing
2. **Add authentication middleware**: Validate JWT tokens or session cookies
3. **Input validation**: Add Zod or Joi for request validation
4. **Rate limiting**: Implement rate limiting on API routes
5. **HTTPS only**: Ensure all traffic uses HTTPS
6. **Environment variables**: Never commit `.env` files
7. **SQL injection prevention**: The `@vercel/postgres` package uses parameterized queries which prevents SQL injection

## Support

If you encounter any issues:
1. Check the Vercel deployment logs
2. Review the database helper functions in `lib/db.ts`
3. Ensure all environment variables are set correctly
4. Test the `/api/init-db` endpoint returns success
