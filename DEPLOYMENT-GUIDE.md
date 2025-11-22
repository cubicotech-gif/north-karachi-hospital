# 🚀 DEPLOYMENT GUIDE - North Karachi Hospital

## Quick Summary
✅ **Code Status**: All changes pushed to `claude/web-app-modifications-01KnYqEbG6TJ5WjBxM3GMJXz`
⏳ **Next Step**: Run database migration on Supabase

---

## Step 1: Locate Your Supabase Project

### Option A: If You Have Supabase Account
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Find your **"North Karachi Hospital"** project (or similar name)
4. Click on the project to open it

### Option B: If You Don't Have Supabase Yet
1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub/Google/Email
4. Create a new project:
   - **Name**: North Karachi Hospital
   - **Database Password**: (choose a strong password and save it!)
   - **Region**: Choose closest to Pakistan (Singapore or Mumbai recommended)
5. Wait 2-3 minutes for project setup

---

## Step 2: Run the Database Migration

### Instructions:

1. **Open SQL Editor**
   - In your Supabase dashboard, click **"SQL Editor"** from the left sidebar
   - Or use this URL format: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql`

2. **Create New Query**
   - Click **"New Query"** button (top right)

3. **Copy Migration SQL**
   - Open the file: `database-migration.sql` (in this project root)
   - Copy ALL the contents (107 lines)

4. **Paste and Run**
   - Paste the SQL into the query editor
   - Click **"Run"** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

5. **Verify Success**
   - You should see a message: **"Success. No rows returned"**
   - If you see errors, send them to me and I'll help fix them

6. **Double-Check Migration**
   - Run this verification query:
   ```sql
   -- Check new columns in patients table
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'patients'
   AND column_name IN ('mr_number', 'care_of');

   -- Check treatments table exists
   SELECT EXISTS (
     SELECT FROM information_schema.tables
     WHERE table_name = 'treatments'
   );
   ```
   - You should see `mr_number` and `care_of` columns
   - The EXISTS check should return `true`

---

## Step 3: Configure Environment Variables

### Get Your Supabase Credentials:

1. **In Supabase Dashboard**, click on **Settings** (gear icon, bottom left)
2. Click on **API** tab
3. You'll see:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (a long string starting with `eyJ...`)

### Add to Your Project:

#### For Local Development:
1. Create a `.env.local` file in project root:
   ```bash
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

2. Example:
   ```bash
   VITE_SUPABASE_URL=https://abcdefgh12345678.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoMTIzNDU2NzgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzOTU4MzYwMCwiZXhwIjoxOTU1MTU5NjAwfQ.example
   ```

#### For Production (Vercel/Netlify):
- Add these same variables in your hosting platform's environment variables section
- **Vercel**: Settings → Environment Variables
- **Netlify**: Site settings → Build & deploy → Environment

---

## Step 4: Test Locally (Optional)

```bash
# Install dependencies (if not already done)
pnpm install

# Start development server
pnpm run dev
```

Visit `http://localhost:5173` and test:
- ✅ Register a new patient (MR number should auto-generate)
- ✅ Add a treatment
- ✅ View patient profile in "All Patients" tab
- ✅ Check billing includes treatments

---

## Step 5: Deploy to Production

### Quick Deploy Options:

#### Option A: Vercel (Recommended - Free)
1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Import Project"**
4. Select your GitHub repository: `cubicotech-gif/north-karachi-hospital`
5. Select branch: `claude/web-app-modifications-01KnYqEbG6TJ5WjBxM3GMJXz`
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click **"Deploy"**
8. Wait 2-3 minutes
9. Your app will be live at: `https://your-project.vercel.app`

#### Option B: Netlify (Free)
1. Go to [https://netlify.com](https://netlify.com)
2. Sign in with GitHub
3. Click **"Add new site"** → **"Import an existing project"**
4. Select GitHub and authorize
5. Choose repository: `cubicotech-gif/north-karachi-hospital`
6. Choose branch: `claude/web-app-modifications-01KnYqEbG6TJ5WjBxM3GMJXz`
7. Build settings:
   - **Build command**: `pnpm run build`
   - **Publish directory**: `dist`
8. Add environment variables (same as above)
9. Click **"Deploy"**
10. Your app will be live at: `https://your-site.netlify.app`

---

## 🎯 Checklist (Complete This!)

- [ ] ✅ Code pushed to git (DONE - branch up to date)
- [ ] Run database migration on Supabase
- [ ] Add environment variables (.env.local for local)
- [ ] Test locally (optional but recommended)
- [ ] Deploy to production (Vercel/Netlify)
- [ ] Test production site
- [ ] Train staff on new features

---

## 🆘 Troubleshooting

### Migration Errors?
- **Error: "relation patients does not exist"**
  - You need to create the initial database schema first
  - Run the base schema SQL before this migration

- **Error: "column already exists"**
  - Migration was already run partially
  - Safe to ignore and continue

### App Not Loading?
- Check browser console for errors (F12)
- Verify environment variables are set correctly
- Ensure Supabase project URL is correct

### Can't Connect to Database?
- Check Supabase project is active (not paused)
- Verify API keys are correct
- Check Row Level Security policies are enabled

---

## 📚 What's Included in This Deployment

### New Features:
✅ MR Number auto-generation
✅ Age field (replaced DOB)
✅ Care Of field
✅ Treatment Management system
✅ Patient Profile with complete history
✅ All Patients tab
✅ Enhanced Billing

### Database Changes:
✅ 2 new columns in `patients` table
✅ New `treatments` table
✅ Auto-generation trigger for MR numbers
✅ Proper indexes for performance

### All Existing Features Work:
✅ Patient Registration
✅ OPD Tokens
✅ Admissions
✅ Lab Orders
✅ Doctor Management
✅ Everything else unchanged

---

## 🎉 After Deployment

Once deployed, you can:
1. Start using the new features immediately
2. Existing patients will get MR numbers automatically
3. All old data remains intact
4. Train your staff on the new Treatment and All Patients features

---

## Need Help?

If you encounter any issues:
1. Check the error message in browser console (F12)
2. Check Supabase logs in dashboard
3. Send me the error details and I'll help resolve it

---

**Last Updated**: 2025-11-22
**Branch**: claude/web-app-modifications-01KnYqEbG6TJ5WjBxM3GMJXz
**Migration File**: database-migration.sql
