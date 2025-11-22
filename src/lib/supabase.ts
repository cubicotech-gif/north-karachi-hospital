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
    search: async (query: string) => {
      return await supabase
        .from('patients')
        .select('*')
        .or(`name.ilike.%${query}%,contact.ilike.%${query}%,cnic_number.ilike.%${query}%,mr_number.ilike.%${query}%`)
        .order('created_at', { ascending: false });
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
  },

  // TREATMENTS
  treatments: {
    getAll: async () => {
      return await supabase.from('treatments').select('*').order('created_at', { ascending: false });
    },
    getByPatientId: async (patientId: string) => {
      return await supabase.from('treatments').select('*').eq('patient_id', patientId).order('date', { ascending: false });
    },
    create: async (data: any) => {
      return await supabase.from('treatments').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('treatments').update(data).eq('id', id).select().single();
    },
    delete: async (id: string) => {
      return await supabase.from('treatments').delete().eq('id', id);
    }
  },

  // PATIENT HISTORY - Get all activities for a patient
  patientHistory: {
    getByPatientId: async (patientId: string) => {
      // Get all OPD tokens for patient
      const opdTokens = await supabase
        .from('opd_tokens')
        .select('*, doctors(name)')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });

      // Get all admissions for patient
      const admissions = await supabase
        .from('admissions')
        .select('*, doctors(name), rooms(room_number, type)')
        .eq('patient_id', patientId)
        .order('admission_date', { ascending: false });

      // Get all lab orders for patient
      const labOrders = await supabase
        .from('lab_orders')
        .select('*, doctors(name)')
        .eq('patient_id', patientId)
        .order('order_date', { ascending: false });

      // Get all treatments for patient
      const treatments = await supabase
        .from('treatments')
        .select('*, doctors(name)')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });

      // Get all appointments for patient
      const appointments = await supabase
        .from('appointments')
        .select('*, doctors(name)')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });

      return {
        opdTokens,
        admissions,
        labOrders,
        treatments,
        appointments
      };
    }
  },

  // UTILITY FUNCTIONS
  utils: {
    // Get next MR number
    getNextMRNumber: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('mr_number')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return 'MR-0001';
      }

      const lastMR = data[0].mr_number;
      if (!lastMR || !lastMR.startsWith('MR-')) {
        return 'MR-0001';
      }

      const lastNumber = parseInt(lastMR.split('-')[1]);
      const nextNumber = lastNumber + 1;
      return `MR-${nextNumber.toString().padStart(4, '0')}`;
    }
  }
};
