import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ SIMPLIFIED DATABASE HELPERS - No complex conversions!
// Just simple, direct database calls that work

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
    getById: async (id: string) => {
      return await supabase.from('departments').select('*').eq('id', id).single();
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
    getById: async (id: string) => {
      return await supabase.from('lab_tests').select('*').eq('id', id).single();
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
    getByPatientId: async (patient_id: string) => {
      return await supabase.from('opd_tokens').select('*').eq('patient_id', patient_id).order('created_at', { ascending: false });
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
    getByPatientId: async (patient_id: string) => {
      return await supabase.from('admissions').select('*').eq('patient_id', patient_id).order('admission_date', { ascending: false });
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
    getByPatientId: async (patient_id: string) => {
      return await supabase.from('lab_orders').select('*').eq('patient_id', patient_id).order('created_at', { ascending: false });
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
      return await supabase.from('appointments').select('*').order('appointment_date', { ascending: true });
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
    getByPatientId: async (patient_id: string) => {
      return await supabase.from('treatments').select('*').eq('patient_id', patient_id).order('date', { ascending: false });
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

  // TREATMENT TYPES
  treatmentTypes: {
    getAll: async () => {
      return await supabase.from('treatment_types').select('*').order('name', { ascending: true });
    },
    getActive: async () => {
      return await supabase.from('treatment_types').select('*').eq('active', true).order('name', { ascending: true });
    },
    getById: async (id: string) => {
      return await supabase.from('treatment_types').select('*').eq('id', id).single();
    },
    create: async (data: any) => {
      return await supabase.from('treatment_types').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('treatment_types').update(data).eq('id', id).select().single();
    },
    delete: async (id: string) => {
      return await supabase.from('treatment_types').delete().eq('id', id);
    }
  },

  // PATIENT HISTORY - Get all related data for a patient
  patientHistory: {
    getByPatientId: async (patient_id: string) => {
      const opdTokens = await supabase
        .from('opd_tokens')
        .select('*, doctors(name)')
        .eq('patient_id', patient_id)
        .order('date', { ascending: false });

      const admissions = await supabase
        .from('admissions')
        .select('*, doctors(name), rooms(room_number, type)')
        .eq('patient_id', patient_id)
        .order('admission_date', { ascending: false });

      const labOrders = await supabase
        .from('lab_orders')
        .select('*, doctors(name)')
        .eq('patient_id', patient_id)
        .order('order_date', { ascending: false });

      const treatments = await supabase
        .from('treatments')
        .select('*, doctors(name)')
        .eq('patient_id', patient_id)
        .order('date', { ascending: false });

      const appointments = await supabase
        .from('appointments')
        .select('*, doctors(name)')
        .eq('patient_id', patient_id)
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

  // HOSPITAL SETTINGS
  hospitalSettings: {
    get: async () => {
      return await supabase.from('hospital_settings').select('*').limit(1).single();
    },
    update: async (data: any) => {
      // Update the single settings record
      return await supabase.from('hospital_settings').update(data).eq('id', (await supabase.from('hospital_settings').select('id').limit(1).single()).data?.id).select().single();
    },
    getNextDocumentNumber: async (docType: string) => {
      return await supabase.rpc('get_next_document_number', { doc_type: docType });
    },
    getNextBirthCertificateNumber: async () => {
      return await supabase.rpc('get_next_birth_certificate_number');
    }
  },

  // GENERATED DOCUMENTS
  generatedDocuments: {
    getAll: async () => {
      return await supabase.from('generated_documents').select('*').order('generated_at', { ascending: false });
    },
    getByPatient: async (patient_id: string) => {
      return await supabase.from('generated_documents').select('*').eq('patient_id', patient_id).order('generated_at', { ascending: false });
    },
    getByType: async (document_type: string) => {
      return await supabase.from('generated_documents').select('*').eq('document_type', document_type).order('generated_at', { ascending: false });
    },
    getByNumber: async (document_number: string) => {
      return await supabase.from('generated_documents').select('*').eq('document_number', document_number).single();
    },
    create: async (data: any) => {
      return await supabase.from('generated_documents').insert([data]).select().single();
    },
    incrementPrintCount: async (id: string) => {
      return await supabase.from('generated_documents')
        .update({
          print_count: supabase.from('generated_documents').select('print_count').eq('id', id),
          last_printed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
    }
  },

  // DOCUMENT CATEGORIES
  documentCategories: {
    getAll: async () => {
      return await supabase.from('document_categories').select('*').order('name');
    },
    getActive: async () => {
      return await supabase.from('document_categories').select('*').eq('active', true).order('name');
    },
    getById: async (id: string) => {
      return await supabase.from('document_categories').select('*').eq('id', id).single();
    },
    create: async (data: any) => {
      return await supabase.from('document_categories').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('document_categories').update(data).eq('id', id).select().single();
    }
  },

  // DOCUMENT TEMPLATES
  documentTemplates: {
    getAll: async () => {
      return await supabase.from('document_templates').select('*').order('created_at', { ascending: false });
    },
    getActive: async () => {
      return await supabase.from('document_templates').select('*').eq('active', true).order('created_at', { ascending: false });
    },
    getByCategory: async (category_id: string) => {
      return await supabase.from('document_templates').select('*').eq('category_id', category_id).eq('active', true).order('name');
    },
    getById: async (id: string) => {
      return await supabase.from('document_templates').select('*').eq('id', id).single();
    },
    create: async (data: any) => {
      return await supabase.from('document_templates').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('document_templates').update(data).eq('id', id).select().single();
    },
    delete: async (id: string) => {
      return await supabase.from('document_templates').update({ active: false }).eq('id', id).select().single();
    }
  },

  // DOCUMENT TEMPLATE MAPPINGS
  documentMappings: {
    getAll: async () => {
      return await supabase.from('document_template_mappings').select('*').order('created_at', { ascending: false });
    },
    getActive: async () => {
      return await supabase.from('document_template_mappings').select('*').eq('is_active', true);
    },
    getByModule: async (module_name: string) => {
      return await supabase.from('document_template_mappings').select('*').eq('module_name', module_name).eq('is_active', true);
    },
    getModuleTemplate: async (module_name: string, document_type: string) => {
      return await supabase.rpc('get_module_template', { mod_name: module_name, doc_type: document_type });
    },
    create: async (data: any) => {
      return await supabase.from('document_template_mappings').insert([data]).select().single();
    },
    delete: async (id: string) => {
      return await supabase.from('document_template_mappings').delete().eq('id', id);
    }
  },

  // DELIVERY RECORDS
  deliveryRecords: {
    getAll: async () => {
      return await supabase.from('delivery_records').select('*').order('delivery_date', { ascending: false });
    },
    getById: async (id: string) => {
      return await supabase.from('delivery_records').select('*').eq('id', id).single();
    },
    getByMotherPatientId: async (mother_patient_id: string) => {
      return await supabase
        .from('delivery_records')
        .select('*, doctors(name)')
        .eq('mother_patient_id', mother_patient_id)
        .order('delivery_date', { ascending: false });
    },
    getByAdmissionId: async (admission_id: string) => {
      return await supabase
        .from('delivery_records')
        .select('*, doctors(name)')
        .eq('admission_id', admission_id)
        .order('birth_order', { ascending: true });
    },
    getByBabyPatientId: async (baby_patient_id: string) => {
      return await supabase
        .from('delivery_records')
        .select('*')
        .eq('baby_patient_id', baby_patient_id)
        .single();
    },
    create: async (data: any) => {
      return await supabase.from('delivery_records').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('delivery_records').update(data).eq('id', id).select().single();
    },
    markCertificatePrinted: async (id: string) => {
      return await supabase
        .from('delivery_records')
        .update({
          birth_certificate_printed: true,
          birth_certificate_printed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
    }
  },

  // NICU OBSERVATIONS
  nicuObservations: {
    getAll: async () => {
      return await supabase.from('nicu_observations').select('*').order('created_at', { ascending: false });
    },
    getByBabyPatientId: async (baby_patient_id: string) => {
      return await supabase
        .from('nicu_observations')
        .select('*, doctors(name)')
        .eq('baby_patient_id', baby_patient_id)
        .order('observation_date', { ascending: false });
    },
    getByAdmissionId: async (admission_id: string) => {
      return await supabase
        .from('nicu_observations')
        .select('*')
        .eq('admission_id', admission_id)
        .order('start_time', { ascending: false });
    },
    getActiveObservations: async () => {
      return await supabase
        .from('nicu_observations')
        .select('*, patients(name, mr_number)')
        .is('end_time', null)
        .order('start_time', { ascending: true });
    },
    create: async (data: any) => {
      return await supabase.from('nicu_observations').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('nicu_observations').update(data).eq('id', id).select().single();
    },
    endObservation: async (id: string, endTime: string, hoursCharged: number, totalCharge: number) => {
      return await supabase
        .from('nicu_observations')
        .update({
          end_time: endTime,
          hours_charged: hoursCharged,
          total_charge: totalCharge
        })
        .eq('id', id)
        .select()
        .single();
    },
    getTotalChargesForAdmission: async (admission_id: string) => {
      const { data, error } = await supabase
        .from('nicu_observations')
        .select('total_charge')
        .eq('admission_id', admission_id);

      if (error) return { data: 0, error };

      const total = data?.reduce((sum, obs) => sum + (obs.total_charge || 0), 0) || 0;
      return { data: total, error: null };
    }
  },

  // BABY PATIENTS (Linked to mothers)
  babyPatients: {
    getByMotherId: async (mother_patient_id: string) => {
      return await supabase
        .from('patients')
        .select('*')
        .eq('mother_patient_id', mother_patient_id)
        .eq('patient_type', 'newborn')
        .order('created_at', { ascending: false });
    },
    getAllNewborns: async () => {
      return await supabase
        .from('patients')
        .select('*, mother:mother_patient_id(name, mr_number)')
        .eq('patient_type', 'newborn')
        .order('created_at', { ascending: false });
    },
    getExternalNewborns: async () => {
      // External newborns are identified by patient_type='newborn' and no mother_patient_id
      return await supabase
        .from('patients')
        .select('*')
        .eq('patient_type', 'newborn')
        .is('mother_patient_id', null)
        .order('created_at', { ascending: false });
    },
    createExternalNewborn: async (data: {
      name: string;
      gender: string;
      contact: string;
      father_name?: string;
      care_of?: string;
      address?: string;
      referral_source?: string;
      referral_notes?: string;
      medical_history?: string;
    }) => {
      // Store father_name in care_of field, and referral info in medical_history
      // External babies have patient_type='newborn' but no mother_patient_id
      const careOfValue = data.father_name ? `Father: ${data.father_name}` : data.care_of;

      let medicalHistoryValue = data.medical_history || '';
      if (data.referral_source) {
        medicalHistoryValue = `[EXTERNAL ADMISSION] Referral: ${data.referral_source}${data.referral_notes ? ` - ${data.referral_notes}` : ''}${medicalHistoryValue ? `\n${medicalHistoryValue}` : ''}`;
      } else {
        medicalHistoryValue = `[EXTERNAL ADMISSION]${medicalHistoryValue ? `\n${medicalHistoryValue}` : ''}`;
      }

      return await supabase.from('patients').insert([{
        name: data.name,
        gender: data.gender,
        contact: data.contact,
        address: data.address,
        care_of: careOfValue,
        medical_history: medicalHistoryValue,
        patient_type: 'newborn',
        mother_patient_id: null, // No mother patient for external babies
        age: 0
      }]).select().single();
    }
  },

  // DISCHARGES
  discharges: {
    getAll: async () => {
      return await supabase
        .from('discharges')
        .select('*, patients(name, mr_number, gender, age), doctors(name)')
        .order('discharge_date', { ascending: false });
    },
    getById: async (id: string) => {
      return await supabase
        .from('discharges')
        .select('*, patients(name, mr_number, gender, age, contact, address, patient_type), doctors(name, specialization)')
        .eq('id', id)
        .single();
    },
    getByPatientId: async (patient_id: string) => {
      return await supabase
        .from('discharges')
        .select('*, doctors(name)')
        .eq('patient_id', patient_id)
        .order('discharge_date', { ascending: false });
    },
    getByAdmissionId: async (admission_id: string) => {
      return await supabase
        .from('discharges')
        .select('*')
        .eq('admission_id', admission_id)
        .single();
    },
    getRecent: async (limit: number = 50) => {
      return await supabase
        .from('discharges')
        .select('*, patients(name, mr_number, gender, age), doctors(name)')
        .order('discharge_date', { ascending: false })
        .limit(limit);
    },
    search: async (query: string) => {
      return await supabase
        .from('discharges')
        .select('*, patients(name, mr_number, gender, age), doctors(name)')
        .or(`discharge_number.ilike.%${query}%`)
        .order('discharge_date', { ascending: false });
    },
    create: async (data: any) => {
      return await supabase.from('discharges').insert([data]).select().single();
    },
    update: async (id: string, data: any) => {
      return await supabase.from('discharges').update(data).eq('id', id).select().single();
    },
    incrementPrintCount: async (id: string) => {
      const { data: current } = await supabase
        .from('discharges')
        .select('print_count')
        .eq('id', id)
        .single();

      return await supabase
        .from('discharges')
        .update({
          print_count: (current?.print_count || 0) + 1,
          last_printed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
    },
    getNextDischargeNumber: async () => {
      return await supabase.rpc('get_next_discharge_number');
    }
  }
};
