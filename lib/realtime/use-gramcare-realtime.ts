'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface RealtimeStatus {
  connected: boolean;
  lastEventAt: string | null;
  lastEventTable: string | null;
  eventCount: number;
}

export function useGramCareRealtime(onTableChange?: (table: string, payload: any) => void): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>({
    connected: false,
    lastEventAt: null,
    lastEventTable: null,
    eventCount: 0
  });

  useEffect(() => {
    const channel = supabase
      .channel('gramcare-realtime-operational')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'referrals' },
        (payload) => {
          handleEvent('referrals', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        (payload) => {
          handleEvent('patients', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follow_ups' },
        (payload) => {
          handleEvent('follow_ups', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'health_records' },
        (payload) => {
          handleEvent('health_records', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_requests' },
        (payload) => {
          handleEvent('support_requests', payload);
        }
      )
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === 'SUBSCRIBED') {
          setStatus(prev => ({ ...prev, connected: true }));
        } else if (subscribeStatus === 'CLOSED' || subscribeStatus === 'CHANNEL_ERROR') {
          setStatus(prev => ({ ...prev, connected: false }));
        }
      });

    function handleEvent(table: string, payload: any) {
      const now = new Date().toLocaleTimeString();
      setStatus(prev => ({
        connected: true,
        lastEventAt: now,
        lastEventTable: table,
        eventCount: prev.eventCount + 1
      }));
      if (onTableChange) {
        onTableChange(table, payload);
      }
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onTableChange]);

  return status;
}
