import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database helper functions
export const db = {
  // PATIENTS
  patients: {
    getAll: async () => {
      return await supabase.from('patients').select('*').order('created_at', { ascending: false });
    },
    getById: async (id: string) => {
      return await supabase.from('patients').select('*').eq('id', id).single();
    },
    create: async (data: any) => {
      return await supabase.from('patients').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('patients').update(data).eq('id', id).select().single();
    },
    delete: async (id: string) => {
      return await supabase.from('patients').delete().eq('id', id);
    }
  },

  // DOCTORS
  doctors: {
    getAll: async () => {
      return await supabase.from('doctors').select('*').order('name', { ascending: true });
    },
    getById: async (id: string) => {
      return await supabase.from('doctors').select('*').eq('id', id).single();
    },
    create: async (data: any) => {
      return await supabase.from('doctors').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('doctors').update(data).eq('id', id).select().single();
    },
    delete: async (id: string) => {
      return await supabase.from('doctors').delete().eq('id', id);
    }
  },

  // DEPARTMENTS
  departments: {
    getAll: async () => {
      return await supabase.from('departments').select('*').order('name', { ascending: true });
    },
    create: async (data: any) => {
      return await supabase.from('departments').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('departments').update(data).eq('id', id).select().single();
    },
    delete: async (id: string) => {
      return await supabase.from('departments').delete().eq('id', id);
    }
  },

  // LAB TESTS
  labTests: {
    getAll: async () => {
      return await supabase.from('lab_tests').select('*').order('name', { ascending: true });
    },
    getActive: async () => {
      return await supabase.from('lab_tests').select('*').eq('active', true).order('name', { ascending: true });
    },
    create: async (data: any) => {
      return await supabase.from('lab_tests').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('lab_tests').update(data).eq('id', id).select().single();
    },
    delete: async (id: string) => {
      return await supabase.from('lab_tests').delete().eq('id', id);
    }
  },

  // ROOMS
  rooms: {
    getAll: async () => {
      return await supabase.from('rooms').select('*').order('room_number', { ascending: true });
    },
    getById: async (id: string) => {
      return await supabase.from('rooms').select('*').eq('id', id).single();
    },
    getAvailable: async () => {
      return await supabase.from('rooms').select('*').eq('active', true).order('room_number', { ascending: true });
    },
    create: async (data: any) => {
      return await supabase.from('rooms').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('rooms').update(data).eq('id', id).select().single();
    },
    delete: async (id: string) => {
      return await supabase.from('rooms').delete().eq('id', id);
    }
  },

  // OPD TOKENS
  opdTokens: {
    getAll: async () => {
      return await supabase.from('opd_tokens').select('*').order('created_at', { ascending: false });
    },
    create: async (data: any) => {
      return await supabase.from('opd_tokens').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('opd_tokens').update(data).eq('id', id).select().single();
    }
  },

  // ADMISSIONS
  admissions: {
    getAll: async () => {
      return await supabase.from('admissions').select('*').order('admission_date', { ascending: false });
    },
    getActive: async () => {
      return await supabase.from('admissions').select('*').eq('status', 'active').order('admission_date', { ascending: false });
    },
    create: async (data: any) => {
      return await supabase.from('admissions').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('admissions').update(data).eq('id', id).select().single();
    }
  },

  // LAB ORDERS
  labOrders: {
    getAll: async () => {
      return await supabase.from('lab_orders').select('*').order('created_at', { ascending: false });
    },
    create: async (data: any) => {
      return await supabase.from('lab_orders').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('lab_orders').update(data).eq('id', id).select().single();
    }
  },

  // USERS
  users: {
    getAll: async () => {
      return await supabase.from('users').select('*').order('created_at', { ascending: false });
    },
    getByUsername: async (username: string) => {
      return await supabase.from('users').select('*').eq('username', username).single();
    },
    create: async (data: any) => {
      return await supabase.from('users').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('users').update(data).eq('id', id).select().single();
    },
    delete: async (id: string) => {
      return await supabase.from('users').delete().eq('id', id);
    }
  },

  // APPOINTMENTS
  appointments: {
    getAll: async () => {
      return await supabase.from('appointments').select('*').order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true });
    },
    getById: async (id: string) => {
      return await supabase.from('appointments').select('*').eq('id', id).single();
    },
    create: async (data: any) => {
      return await supabase.from('appointments').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('appointments').update(data).eq('id', id).select().single();
    },
    delete: async (id: string) => {
      return await supabase.from('appointments').delete().eq('id', id);
    }
  }
};
