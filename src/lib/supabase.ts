import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = 'https://wpguffatusacoilwblmw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZ3VmZmF0dXNhY29pbHdibG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjIyNTMsImV4cCI6MjA3ODc5ODI1M30.NG0JEY-1to7ZGwLLiQsB5t1urYcrZyPvdQDapMfkVfQ';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database helper functions
export const db = {
  // Patients
  patients: {
    getAll: () => supabase.from('patients').select('*').order('created_at', { ascending: false }),
    getById: (id: string) => supabase.from('patients').select('*').eq('id', id).single(),
    create: (data: any) => supabase.from('patients').insert(data).select().single(),
    update: (id: string, data: any) => supabase.from('patients').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('patients').delete().eq('id', id),
    search: (query: string) => supabase.from('patients').select('*').or(`name.ilike.%${query}%,contact.ilike.%${query}%,cnic_number.ilike.%${query}%`)
  },

  // Doctors
  doctors: {
    getAll: () => supabase.from('doctors').select('*').order('name'),
    getById: (id: string) => supabase.from('doctors').select('*').eq('id', id).single(),
    create: (data: any) => supabase.from('doctors').insert(data).select().single(),
    update: (id: string, data: any) => supabase.from('doctors').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('doctors').delete().eq('id', id),
    getByDepartment: (department: string) => supabase.from('doctors').select('*').eq('department', department)
  },

  // Departments
  departments: {
    getAll: () => supabase.from('departments').select('*').order('name'),
    getById: (id: string) => supabase.from('departments').select('*').eq('id', id).single(),
    create: (data: any) => supabase.from('departments').insert(data).select().single(),
    update: (id: string, data: any) => supabase.from('departments').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('departments').delete().eq('id', id)
  },

  // Lab Tests
  labTests: {
    getAll: () => supabase.from('lab_tests').select('*').order('name'),
    getById: (id: string) => supabase.from('lab_tests').select('*').eq('id', id).single(),
    create: (data: any) => supabase.from('lab_tests').insert(data).select().single(),
    update: (id: string, data: any) => supabase.from('lab_tests').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('lab_tests').delete().eq('id', id),
    getActive: () => supabase.from('lab_tests').select('*').eq('active', true).order('name')
  },

  // Rooms
  rooms: {
    getAll: () => supabase.from('rooms').select('*').order('room_number'),
    getById: (id: string) => supabase.from('rooms').select('*').eq('id', id).single(),
    create: (data: any) => supabase.from('rooms').insert(data).select().single(),
    update: (id: string, data: any) => supabase.from('rooms').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('rooms').delete().eq('id', id),
    getAvailable: () => supabase.from('rooms').select('*').filter('occupied_beds', 'lt', 'bed_count')
  },

  // OPD Tokens
  opdTokens: {
    getAll: () => supabase.from('opd_tokens').select('*, patients(*), doctors(*)').order('created_at', { ascending: false }),
    getById: (id: string) => supabase.from('opd_tokens').select('*, patients(*), doctors(*)').eq('id', id).single(),
    create: (data: any) => supabase.from('opd_tokens').insert(data).select().single(),
    update: (id: string, data: any) => supabase.from('opd_tokens').update(data).eq('id', id).select().single(),
    getToday: () => supabase.from('opd_tokens').select('*, patients(*), doctors(*)').eq('date', new Date().toISOString().split('T')[0])
  },

  // Admissions
  admissions: {
    getAll: () => supabase.from('admissions').select('*, patients(*), doctors(*), rooms(*)').order('created_at', { ascending: false }),
    getById: (id: string) => supabase.from('admissions').select('*, patients(*), doctors(*), rooms(*)').eq('id', id).single(),
    create: (data: any) => supabase.from('admissions').insert(data).select().single(),
    update: (id: string, data: any) => supabase.from('admissions').update(data).eq('id', id).select().single(),
    getActive: () => supabase.from('admissions').select('*, patients(*), doctors(*), rooms(*)').eq('status', 'active')
  },

  // Lab Orders
  labOrders: {
    getAll: () => supabase.from('lab_orders').select('*, patients(*), doctors(*)').order('created_at', { ascending: false }),
    getById: (id: string) => supabase.from('lab_orders').select('*, patients(*), doctors(*)').eq('id', id).single(),
    create: (data: any) => supabase.from('lab_orders').insert(data).select().single(),
    update: (id: string, data: any) => supabase.from('lab_orders').update(data).eq('id', id).select().single(),
    getPending: () => supabase.from('lab_orders').select('*, patients(*), doctors(*)').eq('status', 'pending')
  },

  // Users
  users: {
    getAll: () => supabase.from('users').select('*').order('full_name'),
    getById: (id: string) => supabase.from('users').select('*').eq('id', id).single(),
    getByUsername: (username: string) => supabase.from('users').select('*').eq('username', username).single(),
    create: (data: any) => supabase.from('users').insert(data).select().single(),
    update: (id: string, data: any) => supabase.from('users').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('users').delete().eq('id', id)
  }
};

// Helper to convert snake_case to camelCase (Supabase uses snake_case, TypeScript uses camelCase)
export const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

// Helper to convert camelCase to snake_case
export const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnakeCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};
