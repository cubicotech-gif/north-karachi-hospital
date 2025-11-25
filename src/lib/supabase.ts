import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Convert camelCase to snake_case for database
const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

// Convert snake_case to camelCase for frontend
const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Transform object keys from camelCase to snake_case
const keysToSnake = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(keysToSnake);
  
  const result: any = {};
  for (const key in obj) {
    const value = obj[key];
    const snakeKey = toSnakeCase(key);
    
    // Convert empty strings to null for database
    if (value === '' || value === undefined) {
      result[snakeKey] = null;
    } else if (typeof value === 'object' && value !== null) {
      result[snakeKey] = keysToSnake(value);
    } else {
      result[snakeKey] = value;
    }
  }
  return result;
};

// Transform object keys from snake_case to camelCase
const keysToCamel = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(keysToCamel);
  
  const result: any = {};
  for (const key in obj) {
    const value = obj[key];
    const camelKey = toCamelCase(key);
    
    if (typeof value === 'object' && value !== null) {
      result[camelKey] = keysToCamel(value);
    } else {
      result[camelKey] = value;
    }
  }
  return result;
};

// Database helper functions
export const db = {
  // PATIENTS
  patients: {
    getAll: async () => {
      const response = await supabase.from('patients').select('*').order('created_at', { ascending: false });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    getById: async (id: string) => {
      const response = await supabase.from('patients').select('*').eq('id', id).single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    search: async (query: string) => {
      const response = await supabase
        .from('patients')
        .select('*')
        .or(`name.ilike.%${query}%,contact.ilike.%${query}%,cnic_number.ilike.%${query}%,mr_number.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    create: async (data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('patients').insert([dbData]).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('patients').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('patients').delete().eq('id', id);
    }
  },

  // DOCTORS
  doctors: {
    getAll: async () => {
      const response = await supabase.from('doctors').select('*').order('name', { ascending: true });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    getById: async (id: string) => {
      const response = await supabase.from('doctors').select('*').eq('id', id).single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    create: async (data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('doctors').insert([dbData]).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('doctors').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('doctors').delete().eq('id', id);
    }
  },

  // DEPARTMENTS
  departments: {
    getAll: async () => {
      const response = await supabase.from('departments').select('*').order('name', { ascending: true });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    getById: async (id: string) => {
      const response = await supabase.from('departments').select('*').eq('id', id).single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    create: async (data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('departments').insert([dbData]).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('departments').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('departments').delete().eq('id', id);
    }
  },

  // LAB TESTS
  labTests: {
    getAll: async () => {
      const response = await supabase.from('lab_tests').select('*').order('name', { ascending: true });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    getActive: async () => {
      const response = await supabase.from('lab_tests').select('*').eq('active', true).order('name', { ascending: true });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    getById: async (id: string) => {
      const response = await supabase.from('lab_tests').select('*').eq('id', id).single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    create: async (data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('lab_tests').insert([dbData]).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('lab_tests').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('lab_tests').delete().eq('id', id);
    }
  },

  // ROOMS
  rooms: {
    getAll: async () => {
      const response = await supabase.from('rooms').select('*').order('room_number', { ascending: true });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    getById: async (id: string) => {
      const response = await supabase.from('rooms').select('*').eq('id', id).single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    getAvailable: async () => {
      const response = await supabase.from('rooms').select('*').eq('active', true).order('room_number', { ascending: true });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    create: async (data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('rooms').insert([dbData]).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('rooms').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('rooms').delete().eq('id', id);
    }
  },

  // OPD TOKENS
  opdTokens: {
    getAll: async () => {
      const response = await supabase.from('opd_tokens').select('*').order('created_at', { ascending: false });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    create: async (data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('opd_tokens').insert([dbData]).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('opd_tokens').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    }
  },

  // ADMISSIONS
  admissions: {
    getAll: async () => {
      const response = await supabase.from('admissions').select('*').order('admission_date', { ascending: false });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    getActive: async () => {
      const response = await supabase.from('admissions').select('*').eq('status', 'active').order('admission_date', { ascending: false });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    create: async (data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('admissions').insert([dbData]).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('admissions').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    }
  },

  // LAB ORDERS
  labOrders: {
    getAll: async () => {
      const response = await supabase.from('lab_orders').select('*').order('created_at', { ascending: false });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    create: async (data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('lab_orders').insert([dbData]).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('lab_orders').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    }
  },

  // USERS
  users: {
    getAll: async () => {
      const response = await supabase.from('users').select('*').order('created_at', { ascending: false });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    getByUsername: async (username: string) => {
      const response = await supabase.from('users').select('*').eq('username', username).single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    create: async (data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('users').insert([dbData]).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('users').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('users').delete().eq('id', id);
    }
  },

  // APPOINTMENTS
  appointments: {
    getAll: async () => {
      const response = await supabase.from('appointments').select('*').order('appointment_date', { ascending: true });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    getById: async (id: string) => {
      const response = await supabase.from('appointments').select('*').eq('id', id).single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    create: async (data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('appointments').insert([dbData]).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('appointments').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('appointments').delete().eq('id', id);
    }
  },

  // TREATMENTS
  treatments: {
    getAll: async () => {
      const response = await supabase.from('treatments').select('*').order('created_at', { ascending: false });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    getByPatientId: async (patientId: string) => {
      const response = await supabase.from('treatments').select('*').eq('patient_id', patientId).order('date', { ascending: false });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    create: async (data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('treatments').insert([dbData]).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('treatments').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('treatments').delete().eq('id', id);
    }
  },

  // TREATMENT TYPES
  treatmentTypes: {
    getAll: async () => {
      const response = await supabase.from('treatment_types').select('*').order('name', { ascending: true });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    getActive: async () => {
      const response = await supabase.from('treatment_types').select('*').eq('active', true).order('name', { ascending: true });
      return { ...response, data: response.data ? response.data.map(keysToCamel) : null };
    },
    getById: async (id: string) => {
      const response = await supabase.from('treatment_types').select('*').eq('id', id).single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    create: async (data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('treatment_types').insert([dbData]).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    update: async (id: string, data: any) => {
      const dbData = keysToSnake(data);
      const response = await supabase.from('treatment_types').update(dbData).eq('id', id).select().single();
      return { ...response, data: response.data ? keysToCamel(response.data) : null };
    },
    delete: async (id: string) => {
      return await supabase.from('treatment_types').delete().eq('id', id);
    }
  },

  // PATIENT HISTORY
  patientHistory: {
    getByPatientId: async (patientId: string) => {
      const opdTokens = await supabase
        .from('opd_tokens')
        .select('*, doctors(name)')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });

      const admissions = await supabase
        .from('admissions')
        .select('*, doctors(name), rooms(room_number, type)')
        .eq('patient_id', patientId)
        .order('admission_date', { ascending: false });

      const labOrders = await supabase
        .from('lab_orders')
        .select('*, doctors(name)')
        .eq('patient_id', patientId)
        .order('order_date', { ascending: false });

      const treatments = await supabase
        .from('treatments')
        .select('*, doctors(name)')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });

      const appointments = await supabase
        .from('appointments')
        .select('*, doctors(name)')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false});

      return {
        opdTokens: { ...opdTokens, data: opdTokens.data ? opdTokens.data.map(keysToCamel) : [] },
        admissions: { ...admissions, data: admissions.data ? admissions.data.map(keysToCamel) : [] },
        labOrders: { ...labOrders, data: labOrders.data ? labOrders.data.map(keysToCamel) : [] },
        treatments: { ...treatments, data: treatments.data ? treatments.data.map(keysToCamel) : [] },
        appointments: { ...appointments, data: appointments.data ? appointments.data.map(keysToCamel) : [] }
      };
    }
  }
};
