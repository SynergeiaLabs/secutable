import { supabase } from './supabaseClient';

export interface InjectTracking {
  id: string;
  activated_at: string | null;
  handled_at: string | null;
  response_time: number | null;
}

/**
 * Activate an inject (mark as triggered)
 */
export async function activateInject(injectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('injects')
      .update({ 
        activated_at: now 
      })
      .eq('id', injectId);

    if (error) {
      console.error('Error activating inject:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error activating inject:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Mark an inject as handled
 */
export async function handleInject(injectId: string): Promise<{ success: boolean; error?: string; responseTime?: number }> {
  try {
    // First, get the current inject to calculate response time
    const { data: inject, error: fetchError } = await supabase
      .from('injects')
      .select('activated_at')
      .eq('id', injectId)
      .single();

    if (fetchError) {
      console.error('Error fetching inject for handling:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!inject.activated_at) {
      return { success: false, error: 'Inject must be activated before it can be handled' };
    }

    const now = new Date();
    const activatedAt = new Date(inject.activated_at);
    const responseTimeSeconds = Math.floor((now.getTime() - activatedAt.getTime()) / 1000);

    const { error } = await supabase
      .from('injects')
      .update({ 
        handled_at: now.toISOString(),
        response_time: responseTimeSeconds
      })
      .eq('id', injectId);

    if (error) {
      console.error('Error handling inject:', error);
      return { success: false, error: error.message };
    }

    return { success: true, responseTime: responseTimeSeconds };
  } catch (error) {
    console.error('Unexpected error handling inject:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get inject tracking data for a scenario
 */
export async function getInjectTracking(scenarioId: string): Promise<{ 
  success: boolean; 
  data?: InjectTracking[]; 
  error?: string 
}> {
  try {
    const { data, error } = await supabase
      .from('injects')
      .select('id, activated_at, handled_at, response_time')
      .eq('scenario_id', scenarioId)
      .order('time_offset');

    if (error) {
      console.error('Error fetching inject tracking:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching inject tracking:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Reset inject tracking for a scenario (for testing/restarting exercises)
 */
export async function resetInjectTracking(scenarioId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('injects')
      .update({ 
        activated_at: null,
        handled_at: null,
        response_time: null
      })
      .eq('scenario_id', scenarioId);

    if (error) {
      console.error('Error resetting inject tracking:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error resetting inject tracking:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Calculate performance status based on response time
 */
export function calculatePerformanceStatus(responseTimeSeconds: number | null): 'met' | 'delayed' | 'missed' {
  if (responseTimeSeconds === null) {
    return 'missed';
  }
  
  const responseTimeMinutes = responseTimeSeconds / 60;
  if (responseTimeMinutes <= 2) {
    return 'met';
  } else {
    return 'delayed';
  }
}

/**
 * Format response time for display
 */
export function formatResponseTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
} 