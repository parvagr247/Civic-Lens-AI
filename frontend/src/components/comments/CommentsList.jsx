import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addComment } from '../../services/collaborationService';
import { ThumbsUp, Reply, Send, Loader2 } from 'lucide-react';
import { useToast } from '../ui/ToastProvider';
import { getCurrentUser } from '../../services/authService';
import '../../styles/comments/Comments.css';

/**
 * CommentsList component.
 * Recursively renders Reddit-style threaded comments and nested replies.
 */
export default function CommentsList({ comments, incidentId, onCommentAdded, onCommentLiked, parentId = null, depth = 0, incident = null, assignment = null }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const [replyingCommentId, setReplyingCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Filter comments for the current thread level
  const threadComments = comments.filter(c => c.parentId === parentId);

  const handlePostReply = async (commentId) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);

    try {
      const response = await addComment(incidentId, replyText, commentId);
      if (response.success) {
        onCommentAdded(response.data);
        setReplyText('');
        setReplyingCommentId(null);
        toast('Reply posted successfully!', 'success');
      }
    } catch (err) {
      toast('Failed to post reply.', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  if (threadComments.length === 0 && depth === 0) {
    return <p className="text-[10px] text-slate-500 py-2">No discussion comments yet. Start the conversation!</p>;
  }

  return (
    <div className="space-y-3 comments-thread-list">
      {threadComments.map((comment) => {
        const hasLiked = comment.likedBy?.includes(currentUser?.userId);
        
        return (
          <div 
            key={comment.id} 
            className="comment-node-container pl-2 border-l border-slate-200 dark:border-slate-800/80" 
            style={{ marginLeft: depth > 0 ? '12px' : '0px' }}
          >
            {/* Comment details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span 
                  onClick={() => navigate(`/profile/${comment.userId}`)}
                  className="text-[10px] font-bold text-slate-800 dark:text-slate-200 cursor-pointer hover:underline hover:text-emerald-500 transition-colors"
                >
                  {comment.userName}
                </span>
                {incident && comment.userName === incident.reportedBy && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">Citizen</span>
                )}
                {assignment && comment.userName === assignment.officerName && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">Lead Officer</span>
                )}
                <span className="text-[8px] text-slate-500 font-mono">
                  {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <p className="text-[11px] text-slate-650 dark:text-slate-355 leading-relaxed pl-1">{comment.content}</p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 text-[9px] font-bold text-slate-505 pl-1 pt-0.5">
                <button 
                  onClick={() => onCommentLiked(comment.id)}
                  className={`flex items-center gap-1 transition-colors duration-200 ${
                    hasLiked ? 'text-emerald-505 dark:text-emerald-400' : 'hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <ThumbsUp size={10} />
                  <span>{comment.likesCount || 0} Likes</span>
                </button>

                <button 
                  onClick={() => {
                    setReplyingCommentId(replyingCommentId === comment.id ? null : comment.id);
                    setReplyText('');
                  }}
                  className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200"
                >
                  <Reply size={10} />
                  <span>Reply</span>
                </button>
              </div>
            </div>

            {/* Inline Reply Form */}
            {replyingCommentId === comment.id && (
              <div className="flex gap-2 mt-2 pl-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Post nested reply..."
                  className="flex-1 bg-slate-50 dark:bg-slate-955/60 border border-slate-205 dark:border-slate-850 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  autoFocus
                />
                <button
                  onClick={() => handlePostReply(comment.id)}
                  disabled={submittingReply || !replyText.trim()}
                  className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg font-bold hover:bg-emerald-400 disabled:opacity-40 transition-colors"
                >
                  {submittingReply ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Send size={10} />
                  )}
                </button>
              </div>
            )}

            {/* Recursive Nested Replies list */}
            <CommentsList 
              comments={comments} 
              incidentId={incidentId} 
              onCommentAdded={onCommentAdded}
              onCommentLiked={onCommentLiked}
              parentId={comment.id}
              depth={depth + 1}
              incident={incident}
              assignment={assignment}
            />

          </div>
        );
      })}
    </div>
  );
}
