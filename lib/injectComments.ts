import { supabase } from './supabaseClient';

export interface InjectComment {
  id: string;
  inject_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_email?: string;
}

/**
 * Get comments for an inject
 */
export async function getInjectComments(injectId: string): Promise<{ 
  success: boolean; 
  data?: InjectComment[]; 
  error?: string 
}> {
  try {
    const { data, error } = await supabase
      .from('inject_comments')
      .select('*')
      .eq('inject_id', injectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching inject comments:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching inject comments:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Add a comment to an inject
 */
export async function addInjectComment(injectId: string, comment: string): Promise<{ 
  success: boolean; 
  data?: InjectComment; 
  error?: string 
}> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('inject_comments')
      .insert({
        inject_id: injectId,
        user_id: user.id,
        comment: comment.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding inject comment:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error adding inject comment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Delete a comment
 */
export async function deleteInjectComment(commentId: string): Promise<{ 
  success: boolean; 
  error?: string 
}> {
  try {
    const { error } = await supabase
      .from('inject_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting inject comment:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting inject comment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Format comment timestamp for display
 */
export function formatCommentTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
} 