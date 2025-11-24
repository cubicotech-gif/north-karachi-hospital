# Treatment Types Management - Migration Guide

## Overview
This update adds a comprehensive Treatment Types Management system that allows you to:
- Create and manage treatment types with detailed information
- Define treatment processes, requirements, and default prices
- Use predefined treatments in the patient treatment module
- Categorize treatments (Maternity, Surgical, Medical, Emergency, etc.)

## Database Migration

### Important: Run the Migration Script
The database migration script has been updated to include the `treatment_types` table.

**To apply the migration:**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `database-migration.sql` file
5. Click **Run** to execute the migration

The migration will:
- ✅ Create the `treatment_types` table
- ✅ Add 10 default treatment types (Normal Delivery, C-Section, etc.)
- ✅ Set up proper indexes and Row Level Security
- ✅ Be safe to run even if some parts already exist (uses `IF NOT EXISTS`)

### What's New

#### 1. Treatment Types Management Module
- **Location**: Treatment Types menu in the sidebar
- **Features**:
  - Add new treatment types with detailed information
  - Edit existing treatment types
  - Activate/deactivate treatments
  - Delete treatment types
  - Search and filter by category
  - Set default prices, duration, process details, and requirements

#### 2. Updated Treatment Module
- **Dropdown**: Now pulls treatment types from the database
- **Auto-fill**: Selecting a treatment type auto-fills:
  - Default price
  - Description
  - Treatment information (category, duration, process, requirements)
- **Real-time**: Shows treatment details when selected
- **Flexible**: You can still modify the price and name after selection

## Usage Workflow

### Step 1: Manage Treatment Types
1. Navigate to **Treatment Types** module
2. Click **Add Treatment Type**
3. Fill in the details:
   - Name (e.g., "Normal Delivery")
   - Category (e.g., "Maternity")
   - Default Price
   - Description
   - Process Details (how the treatment is performed)
   - Duration (estimated time)
   - Requirements (what's needed before the treatment)
4. Click **Create Treatment Type**

### Step 2: Add Patient Treatment
1. Select a patient from **Patient Registration**
2. Navigate to **Treatment** module
3. Click **Add Treatment**
4. Select treatment type from dropdown (shows name and price)
5. Review the auto-filled information
6. Modify if needed (price, name, description)
7. Select doctor (optional)
8. Set payment status
9. Add notes if needed
10. Click **Add Treatment**

## Default Treatment Types Included

The migration includes these 10 default treatment types:

1. **Normal Delivery** - Rs. 15,000 (Maternity)
2. **C-Section Operation** - Rs. 50,000 (Surgical)
3. **Dressing** - Rs. 500 (Medical)
4. **Seizure Care** - Rs. 3,000 (Emergency)
5. **IV Therapy** - Rs. 1,500 (Medical)
6. **Post-Natal Care** - Rs. 2,000 (Maternity)
7. **Pre-Natal Checkup** - Rs. 1,000 (Maternity)
8. **Vaccination** - Rs. 800 (Preventive)
9. **Minor Surgery** - Rs. 10,000 (Surgical)
10. **Emergency Care** - Rs. 5,000 (Emergency)

You can edit these or add your own custom treatment types.

## Benefits

✅ **Centralized Management**: All treatment types in one place
✅ **Consistency**: Same treatment always has the same default price
✅ **Efficiency**: No need to type treatment details every time
✅ **Flexibility**: Can override prices and details when needed
✅ **Documentation**: Store process details and requirements
✅ **Control**: Activate/deactivate treatments as needed

## Troubleshooting

### Treatment Types Not Showing in Dropdown
- Make sure you've run the database migration
- Check that treatment types are marked as "Active"
- Try refreshing the page

### Migration Errors
- The migration is safe to run multiple times
- If you get errors, check your Supabase connection
- Contact support if issues persist

## Next Steps

1. Run the database migration
2. Review the default treatment types
3. Add or modify treatment types as needed
4. Start using the new treatment workflow
5. Train staff on the new system

---

**Need Help?** Check the main documentation or contact your system administrator.
