# ⚡ QUICK START - Run Migration Now!

## 🎯 3-Step Deployment (5 Minutes)

### ✅ STEP 1: Open Supabase
1. Go to: **https://supabase.com/dashboard**
2. Sign in (or create account if new)
3. Open your project OR create new project named "North Karachi Hospital"

---

### ✅ STEP 2: Run Migration SQL
1. Click **"SQL Editor"** in left sidebar
2. Click **"New Query"**
3. Copy everything from `database-migration.sql` file
4. Paste into query editor
5. Click **"Run"** (or press Ctrl+Enter)
6. Wait for "Success" message

---

### ✅ STEP 3: Get API Keys & Deploy
1. In Supabase, go to **Settings** → **API**
2. Copy:
   - **Project URL** (https://xxxxx.supabase.co)
   - **Anon public key** (long string starting with eyJ...)

3. Add to your deployment platform:
   ```
   VITE_SUPABASE_URL=<your project url>
   VITE_SUPABASE_ANON_KEY=<your anon key>
   ```

4. Deploy on **Vercel** or **Netlify** (both free)

---

## 🎉 Done! Your Hospital System is Live!

### What You Got:
- ✅ Auto-generated MR Numbers
- ✅ Treatment Management
- ✅ Patient Profiles
- ✅ Complete Medical History
- ✅ Enhanced Billing

### Test It:
1. Register a patient → MR number auto-creates
2. Add a treatment → Select type, price fills automatically
3. View "All Patients" → See complete history
4. Check "Billing" → Treatments included!

---

## 🆘 Stuck? Common Issues:

**Q: Can't find Supabase project?**
→ Create new project, wait 2 mins for setup

**Q: Migration gives error?**
→ Send me the error message, I'll help

**Q: Where to add environment variables?**
→ Create `.env.local` file in project root (for local testing)
→ OR add in Vercel/Netlify dashboard (for production)

---

## 📱 Need Full Instructions?
See `DEPLOYMENT-GUIDE.md` for detailed step-by-step guide with screenshots and troubleshooting.

---

**Pro Tip**: Run migration on Supabase FIRST, then deploy code. This ensures database is ready when app starts!
