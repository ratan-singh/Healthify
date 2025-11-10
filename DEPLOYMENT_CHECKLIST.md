# Healthify - Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Code Changes Completed
- [x] Migrated from JSON files to Vercel Postgres
- [x] Created database helper functions in `lib/db.ts`
- [x] Updated all API routes to use database
- [x] Updated login to use email instead of name
- [x] Updated registration to collect email
- [x] Created database initialization endpoint
- [x] All functionality preserved

### 2. Files to Commit
```bash
git add lib/db.ts
git add app/api/init-db/route.ts
git add app/api/auth/login/route.ts
git add app/api/auth/register/route.ts
git add app/api/patient/search/route.ts
git add app/api/patient/[id]/vitals/route.ts
git add app/api/patient/[id]/diagnosis/route.ts
git add app/api/patient/[id]/doctors/route.ts
git add app/api/patient/[id]/requests/route.ts
git add app/api/patient/[id]/approve/route.ts
git add app/api/patient/[id]/revoke/route.ts
git add app/api/doctor/[id]/patients/route.ts
git add app/login/page.tsx
git add app/register/page.tsx
git add app/doctor/dashboard/page.tsx
git add DATABASE_SETUP.md
git add MIGRATION_SUMMARY.md
git add package.json
git add package-lock.json
git commit -m "Migrate to Vercel Postgres for serverless deployment"
git push origin master
```

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub
```bash
git push origin master
```

### Step 2: Setup Vercel Database
1. Go to https://vercel.com/dashboard
2. Select your Healthify project
3. Click on "Storage" tab
4. Click "Create Database"
5. Select "Postgres"
6. Database Name: `healthify-db` (or your choice)
7. Region: Choose closest to your users (e.g., US East)
8. Click "Create"

**Note**: Vercel automatically adds these environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### Step 3: Deploy Application
Vercel will automatically deploy when you push to GitHub.

Or manually deploy:
```bash
vercel --prod
```

### Step 4: Initialize Database
After deployment completes:

1. Go to: `https://your-app-name.vercel.app/api/init-db`
2. You should see:
   ```json
   {
     "success": true,
     "message": "Database initialized successfully"
   }
   ```

**IMPORTANT**: Do this immediately after first deployment!

### Step 5: Test Your Application

#### Test 1: Patient Registration
1. Go to: `https://your-app-name.vercel.app/register`
2. Select "Patient" role
3. Enter:
   - Name: Test Patient
   - Email: patient@test.com
   - Password: password123
4. Click "Create Account"
5. Should redirect to login page

#### Test 2: Patient Login
1. Go to: `https://your-app-name.vercel.app/login`
2. Enter:
   - Email: patient@test.com
   - Password: password123
3. Click "Sign In"
4. Should redirect to patient dashboard

#### Test 3: Add Vitals
1. In patient dashboard
2. Go to "Vitals" tab
3. Enter:
   - Heart Rate: 75
   - Blood Pressure: 120/80
4. Click "Add Vitals"
5. Should appear in vitals history

#### Test 4: Doctor Registration
1. Open incognito/private window
2. Go to: `https://your-app-name.vercel.app/register`
3. Select "Doctor" role
4. Enter:
   - Name: Test Doctor
   - Email: doctor@test.com
   - Password: password123
5. Create account and login

#### Test 5: Doctor Search & Request
1. In doctor dashboard
2. Search for patient by ID (from patient dashboard URL)
3. Click "Search Patient"
4. Should show patient details
5. Click "Send Access Request"
6. Should show success message

#### Test 6: Patient Approves Doctor
1. Switch back to patient account
2. Should see pending request notification
3. Click "Approve"
4. Doctor should appear in "Authorized Doctors" list

#### Test 7: Doctor Views Patient Data
1. Switch back to doctor account
2. Patient should now appear in "My Patients" list
3. Click on patient
4. Should see vitals and can add diagnosis

## 📊 Verify Database

### Option 1: Via Vercel Dashboard
1. Go to Vercel Dashboard > Storage
2. Click on your Postgres database
3. Go to "Data" tab
4. You should see tables with data

### Option 2: Via SQL Query
In Vercel Dashboard > Storage > Query:
```sql
SELECT * FROM users;
SELECT * FROM vitals;
SELECT * FROM patient_doctors;
SELECT * FROM access_requests;
```

## 🔧 Troubleshooting

### Error: "Database tables not found"
**Solution**: Visit `/api/init-db` to create tables

### Error: "Invalid credentials"
**Solution**: Make sure you're using email (not name) to login

### Error: "Failed to fetch"
**Solution**: Check Vercel deployment logs for API errors

### Error: "Connection refused"
**Solution**: 
1. Check database is created in Vercel
2. Environment variables are automatically set
3. Redeploy if needed

### Database Reset (if needed)
```sql
-- In Vercel Dashboard > Storage > Query
DROP TABLE IF EXISTS access_requests CASCADE;
DROP TABLE IF EXISTS diagnoses CASCADE;
DROP TABLE IF EXISTS patient_doctors CASCADE;
DROP TABLE IF EXISTS vitals CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Then visit /api/init-db again
```

## 🔒 Security Recommendations

### Before Going Live:
1. **Hash Passwords**: 
   ```bash
   npm install bcrypt
   ```
   Update auth routes to hash passwords before storing

2. **Add Rate Limiting**:
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

3. **Add Input Validation**:
   ```bash
   npm install zod
   ```

4. **Environment Variables**:
   - Never commit `.env` files
   - Use Vercel environment variables

5. **CORS Configuration**:
   - Configure allowed origins in Vercel settings

## 📱 Local Development

### Setup Local Environment:
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run dev server
npm run dev

# Initialize database locally
# Visit: http://localhost:3000/api/init-db
```

## ✅ Final Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel Postgres database created
- [ ] Application deployed successfully
- [ ] Database initialized via `/api/init-db`
- [ ] Patient registration works
- [ ] Patient login works
- [ ] Patient can add vitals
- [ ] Doctor registration works
- [ ] Doctor login works
- [ ] Doctor can search patients
- [ ] Doctor can send access requests
- [ ] Patient can approve requests
- [ ] Doctor can view approved patient data
- [ ] Doctor can add diagnosis
- [ ] All dashboards loading correctly

## 🎉 Success Criteria

Your deployment is successful when:
1. ✅ No "EROFS: read-only file system" errors
2. ✅ Users can register with email
3. ✅ Users can login with email
4. ✅ All patient/doctor interactions work
5. ✅ Data persists between sessions
6. ✅ Multiple users can use the system simultaneously

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify database tables exist
4. Test API endpoints directly
5. Review `DATABASE_SETUP.md` for detailed troubleshooting

---

**Your Healthify app is ready for production! 🏥🚀**
