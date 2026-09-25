import { supabase } from '@/lib/supabase/client';

export type DatabaseRole = 'central_authority' | 'phc_head' | 'phc_worker' | 'patient';
export type UiRole = 'central' | 'head' | 'worker' | 'doctor' | 'hospital' | 'patient';
const roleAliases: Record<string, UiRole> = {
  central_authority: 'central', central: 'central', admin: 'central', medical_officer: 'central', 
  'central authority': 'central', 'central-authority': 'central', 'central authority admin': 'central',
  phc_head: 'head', head: 'head', 
  'phc head': 'head', 'area head': 'head',
  phc_worker: 'worker', worker: 'worker', asha: 'worker', anm: 'worker', 
  'phc worker': 'worker', 'health worker': 'worker',
  doctor: 'doctor', hospital: 'hospital', 
  patient: 'patient' 
};

export const uiRoleFor = (role: string): UiRole => {
  const normalized = role.trim().toLowerCase().replace(/[\s-]+/g, ' ');
  const key = normalized.replace(/ /g, '_');
  return roleAliases[key] || roleAliases[normalized] || 'patient';
};

export async function currentRole(): Promise<UiRole | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (data?.role) return uiRoleFor(data.role);
      return null;
    }
    if (typeof window !== 'undefined') {
      const demoRole = localStorage.getItem('override_role') || localStorage.getItem('gramcare_role') || localStorage.getItem('demo_role');
      if (demoRole) return uiRoleFor(demoRole);
    }
    return null;
  } catch {
    return null;
  }
}
