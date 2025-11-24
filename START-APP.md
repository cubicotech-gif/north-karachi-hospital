# 🚀 HOW TO START YOUR APP

## ✅ GOOD NEWS: App is Running!

Your app is now running at: **http://localhost:5173/**

---

## ⚠️ ONE MORE STEP - Add Your Supabase Key

I've created a `.env` file, but you need to add your **Supabase Anon Key**.

### How to Get Your Supabase Key:

1. Go to: https://supabase.com/dashboard
2. Click on your project: `wpguffatusacoilwblmw`
3. Click **Settings** (gear icon) in the left sidebar
4. Click **API** section
5. Copy the **anon/public** key (long string starting with "eyJ...")

### Add It to .env File:

1. Open the file: `.env` (in your project root)
2. Replace `your_supabase_anon_key_here` with your actual key
3. Save the file
4. Refresh your browser (F5)

**Example:**
```
VITE_SUPABASE_URL=https://wpguffatusacoilwblmw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZ3VmZmF0dXNhY29pbHdibG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk...
```

---

## 🗄️ STILL Need to Run SQL

After adding the Supabase key, you STILL need to create the `treatment_types` table:

1. Go to Supabase: https://supabase.com/dashboard
2. Click **SQL Editor**
3. Copy content from `SIMPLE-FIX.sql`
4. Paste and click **RUN**

---

## 🎯 Quick Checklist:

- ✅ Dependencies installed (DONE)
- ✅ Dev server running (DONE - http://localhost:5173)
- ⚠️ Add Supabase anon key to `.env` file (YOU NEED TO DO THIS)
- ⚠️ Run `SIMPLE-FIX.sql` in Supabase (YOU NEED TO DO THIS)

---

## 💻 App Commands:

```bash
# Start the app
pnpm dev

# Stop the app
Ctrl + C

# Install dependencies (if needed)
pnpm install
```

---

## 🆘 If Still Not Working:

1. Make sure you added the correct Supabase anon key
2. Make sure you ran the SQL script
3. Hard refresh browser (Ctrl + Shift + R)
4. Check browser console (F12) for errors
