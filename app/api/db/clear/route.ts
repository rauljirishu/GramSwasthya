import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST() {
  try {
    // Delete in sequence to respect foreign keys if any
    await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('follow_ups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('referral_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('referrals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('risk_assessments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('health_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('clinical_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('patient_accounts').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    return NextResponse.json({
      success: true,
      message: 'Database patient, clinical, appointment, and referral data reset successfully.'
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to reset database records.'
    }, { status: 500 });
  }
}
