'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/authContext';

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  user_email?: string;
}

interface InjectCommentsProps {
  injectId: string;
  readOnly?: boolean;
}

export default function InjectComments({ injectId, readOnly = false }: InjectCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (injectId) {
      fetchComments();
    }
  }, [injectId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('inject_comments')
        .select(`
          id,
          comment,
          created_at,
          user_id
        `)
        .eq('inject_id', injectId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      // For now, we'll use the user_id as the email since we can't easily join with auth.users
      // In a production app, you might want to store the email in the comments table or use a different approach
      const transformedComments = data?.map(comment => ({
        ...comment,
        user_email: `User ${comment.user_id.slice(0, 8)}` // Show partial user ID as placeholder
      })) || [];

      setComments(transformedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('inject_comments')
        .insert({
          inject_id: injectId,
          user_id: user.id,
          comment: newComment.trim()
        });

      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      setNewComment('');
      setShowInput(false);
      await fetchComments(); // Refresh comments
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('inject_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        return;
      }

      await fetchComments(); // Refresh comments
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Don't render anything if no comments and in read-only mode
  if (readOnly && comments.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Comments List */}
      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg text-sm ${
                readOnly 
                  ? 'bg-gray-50 text-gray-700' 
                  : 'bg-blue-50 text-blue-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="mb-1">{comment.comment}</p>
                  <div className="flex items-center text-xs opacity-75">
                    <span>{comment.user_email || 'Unknown user'}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(comment.created_at)}</span>
                  </div>
                </div>
                {!readOnly && user && comment.user_id === user.id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                    title="Delete comment"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Button (only in non-read-only mode) */}
      {!readOnly && user && (
        <div>
          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              💬 Add Comment
            </button>
          ) : (
            <form onSubmit={handleSubmitComment} className="space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add your comment..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowInput(false);
                    setNewComment('');
                  }
                }}
              />
              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInput(false);
                    setNewComment('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
} 