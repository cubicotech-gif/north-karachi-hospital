import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to convert camelCase to snake_case
const toSnakeCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  
  const result: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    let value = obj[key];
    
    // Handle empty strings for number fields - convert to null or 0
    if (value === '' || value === 'NaN' || (typeof value === 'number' && isNaN(value))) {
      // For required number fields, provide 0 as default
      if (['fee', 'deposit', 'price', 'total_amount', 'opd_fee', 'commission_rate', 'experience', 'bed_count', 'occupied_beds', 'price_per_day', 'token_number', 'bed_number'].includes(snakeKey)) {
        value = 0;
      } else {
        value = null;
      }
    }
    
    result[snakeKey] = toSnakeCase(value);
  }
  return result;
};

// Helper function to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  
  const result: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(obj[key]);
  }
  return result;
};

// Database helper functions
export const db = {
  // PATIENTS
  patients: {
    getAll: async () => {
      const response = await supabase.from('patients').select('*').order('created_at', { ascending: false });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    getById: async (id: string) => {
      const response = await supabase.from('patients').select('*').eq('id', id).single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    search: async (query: string) => {
      const response = await supabase
        .from('patients')
        .select('*')
        .or(`name.ilike.%${query}%,contact.ilike.%${query}%,cnic_number.ilike.%${query}%,mr_number.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    create: async (data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('patients').insert([dbData]).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('patients').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('patients').delete().eq('id', id);
    }
  },

  // DOCTORS
  doctors: {
    getAll: async () => {
      const response = await supabase.from('doctors').select('*').order('name', { ascending: true });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    getById: async (id: string) => {
      const response = await supabase.from('doctors').select('*').eq('id', id).single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    create: async (data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('doctors').insert([dbData]).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('doctors').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('doctors').delete().eq('id', id);
    }
  },

  // DEPARTMENTS
  departments: {
    getAll: async () => {
      const response = await supabase.from('departments').select('*').order('name', { ascending: true });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    create: async (data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('departments').insert([dbData]).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('departments').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('departments').delete().eq('id', id);
    }
  },

  // LAB TESTS
  labTests: {
    getAll: async () => {
      const response = await supabase.from('lab_tests').select('*').order('name', { ascending: true });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    getActive: async () => {
      const response = await supabase.from('lab_tests').select('*').eq('active', true).order('name', { ascending: true });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    create: async (data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('lab_tests').insert([dbData]).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('lab_tests').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('lab_tests').delete().eq('id', id);
    }
  },

  // ROOMS
  rooms: {
    getAll: async () => {
      const response = await supabase.from('rooms').select('*').order('room_number', { ascending: true });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    getById: async (id: string) => {
      const response = await supabase.from('rooms').select('*').eq('id', id).single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    getAvailable: async () => {
      const response = await supabase.from('rooms').select('*').eq('active', true).order('room_number', { ascending: true });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    create: async (data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('rooms').insert([dbData]).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('rooms').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('rooms').delete().eq('id', id);
    }
  },

  // OPD TOKENS
  opdTokens: {
    getAll: async () => {
      const response = await supabase.from('opd_tokens').select('*').order('created_at', { ascending: false });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    create: async (data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('opd_tokens').insert([dbData]).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('opd_tokens').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    }
  },

  // ADMISSIONS
  admissions: {
    getAll: async () => {
      const response = await supabase.from('admissions').select('*').order('admission_date', { ascending: false });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    getActive: async () => {
      const response = await supabase.from('admissions').select('*').eq('status', 'active').order('admission_date', { ascending: false });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    create: async (data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('admissions').insert([dbData]).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('admissions').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    }
  },

  // LAB ORDERS
  labOrders: {
    getAll: async () => {
      const response = await supabase.from('lab_orders').select('*').order('created_at', { ascending: false });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    create: async (data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('lab_orders').insert([dbData]).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('lab_orders').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    }
  },

  // USERS
  users: {
    getAll: async () => {
      const response = await supabase.from('users').select('*').order('created_at', { ascending: false });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    getByUsername: async (username: string) => {
      const response = await supabase.from('users').select('*').eq('username', username).single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    create: async (data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('users').insert([dbData]).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('users').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('users').delete().eq('id', id);
    }
  },

  // APPOINTMENTS
  appointments: {
    getAll: async () => {
      const response = await supabase.from('appointments').select('*').order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    getById: async (id: string) => {
      const response = await supabase.from('appointments').select('*').eq('id', id).single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    create: async (data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('appointments').insert([dbData]).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('appointments').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('appointments').delete().eq('id', id);
    }
  },

  // TREATMENTS
  treatments: {
    getAll: async () => {
      const response = await supabase.from('treatments').select('*').order('created_at', { ascending: false });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    getByPatientId: async (patientId: string) => {
      const response = await supabase.from('treatments').select('*').eq('patient_id', patientId).order('date', { ascending: false });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    create: async (data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('treatments').insert([dbData]).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('treatments').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('treatments').delete().eq('id', id);
    }
  },

  // TREATMENT TYPES
  treatmentTypes: {
    getAll: async () => {
      const response = await supabase.from('treatment_types').select('*').order('name', { ascending: true });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    getActive: async () => {
      const response = await supabase.from('treatment_types').select('*').eq('active', true).order('name', { ascending: true });
      return { ...response, data: response.data ? response.data.map(toCamelCase) : null };
    },
    getById: async (id: string) => {
      const response = await supabase.from('treatment_types').select('*').eq('id', id).single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    create: async (data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('treatment_types').insert([dbData]).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = toSnakeCase(data);
      const response = await supabase.from('treatment_types').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? toCamelCase(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('treatment_types').delete().eq('id', id);
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
        opdTokens: { ...opdTokens, data: opdTokens.data ? opdTokens.data.map(toCamelCase) : null },
        admissions: { ...admissions, data: admissions.data ? admissions.data.map(toCamelCase) : null },
        labOrders: { ...labOrders, data: labOrders.data ? labOrders.data.map(toCamelCase) : null },
        treatments: { ...treatments, data: treatments.data ? treatments.data.map(toCamelCase) : null },
        appointments: { ...appointments, data: appointments.data ? appointments.data.map(toCamelCase) : null }
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
