import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllIncidents, toggleIncidentSupport } from '../services/issueService';
import { 
  addComment, 
  getComments, 
  likeComment, 
  followUser, 
  unfollowUser, 
  getFollowing,
  saveReport,
  unsaveReport,
  getSavedReportIds,
  logShare 
} from '../services/collaborationService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  Bookmark, 
  UserPlus, 
  UserMinus, 
  Globe, 
  MapPin, 
  Sparkles, 
  Calendar,
  Send,
  Loader2,
  Copy
} from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';
import { getCurrentUser } from '../services/authService';
import CommentsList from '../components/comments/CommentsList';
import '../styles/community/Feed.css';

const Twitter = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Linkedin = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

/**
 * CommunityFeed page component.
 * Displays city-wide issue uploads in a social feed layout with comments, saves, shares, and follows.
 */
export default function CommunityFeed() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  
  // Feed interaction states
  const [activeCommentIncidentId, setActiveCommentIncidentId] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [shareDropdownId, setShareDropdownId] = useState(null);

  const loadFeedData = async () => {
    try {
      const incRes = await getAllIncidents();
      // Handle response envelope
      const incidentsList = incRes.success ? incRes.data : (Array.isArray(incRes) ? incRes : []);
      setIncidents(incidentsList);

      const followRes = await getFollowing();
      if (followRes.success) setFollowing(followRes.data || []);

      const savedRes = await getSavedReportIds();
      if (savedRes.success) setSavedIds(savedRes.data || []);
    } catch (err) {
      console.error('Failed to load feed resources', err);
      toast('Failed to load feed activities.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedData();
  }, []);

  const handleFollowToggle = async (reporterEmail) => {
    const isFollowing = following.includes(reporterEmail);
    try {
      if (isFollowing) {
        await unfollowUser(reporterEmail);
        setFollowing(prev => prev.filter(email => email !== reporterEmail));
        toast(`Unfollowed contributor.`, 'success');
      } else {
        await followUser(reporterEmail);
        setFollowing(prev => [...prev, reporterEmail]);
        toast(`Following contributor!`, 'success');
      }
    } catch (err) {
      toast('Failed to update follow connection.', 'error');
    }
  };

  const handleSaveToggle = async (incidentId) => {
    const isSaved = savedIds.includes(incidentId);
    try {
      if (isSaved) {
        await unsaveReport(incidentId);
        setSavedIds(prev => prev.filter(id => id !== incidentId));
        toast('Bookmark removed.', 'success');
      } else {
        await saveReport(incidentId);
        setSavedIds(prev => [...prev, incidentId]);
        toast('Incident bookmarked!', 'success');
      }
    } catch (err) {
      toast('Failed to update bookmark.', 'error');
    }
  };

  const handleSupportToggle = async (incidentId) => {
    if (!currentUser) {
      toast('You must be logged in to support reports.', 'error');
      return;
    }
    try {
      const response = await toggleIncidentSupport(incidentId);
      if (response.success && response.data) {
        // Update the incident in the local state
        setIncidents(prev => prev.map(inc => 
          inc.id === incidentId 
            ? { 
                ...inc, 
                supportCount: response.data.supportCount, 
                supportedBy: response.data.supportedBy 
              } 
            : inc
        ));
        
        const hasSupportedAfter = Array.isArray(response.data.supportedBy) && response.data.supportedBy.includes(currentUser.email);
        if (hasSupportedAfter) {
          toast('Supported incident! +5 XP', 'success');
        } else {
          toast('Removed support.', 'success');
        }
      }
    } catch (err) {
      console.error(err);
      toast('Failed to update support status.', 'error');
    }
  };

  const handleShareClick = async (incidentId, platform) => {
    setShareDropdownId(null);
    await logShare(incidentId);
    
    const shareUrl = `${window.location.origin}/risk-intelligence`; // detail route link
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      toast('Copied link to clipboard!', 'success');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=Check out this civic issue report: ${shareUrl}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, '_blank');
    }
  };

  const toggleCommentsDrawer = async (incidentId) => {
    if (activeCommentIncidentId === incidentId) {
      setActiveCommentIncidentId(null);
      return;
    }

    setActiveCommentIncidentId(incidentId);
    try {
      const response = await getComments(incidentId);
      if (response.success) {
        setCommentsMap(prev => ({ ...prev, [incidentId]: response.data || [] }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (incidentId) => {
    if (!newCommentText.trim()) return;
    setSubmittingComment(true);

    try {
      const response = await addComment(incidentId, newCommentText, null);
      if (response.success) {
        setCommentsMap(prev => ({
          ...prev,
          [incidentId]: [...(prev[incidentId] || []), response.data]
        }));
        setNewCommentText('');
        toast('Comment posted successfully!', 'success');
      }
    } catch (err) {
      toast('Failed to post comment.', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'RESOLVED': return 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60';
      case 'IN_PROGRESS': return 'bg-blue-950/40 text-blue-400 border-blue-900/60';
      case 'INVESTIGATING': return 'bg-amber-950/40 text-amber-400 border-amber-900/60';
      case 'REPORTED':
      default: return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 size={32} className="animate-spin text-emerald-400" />
        <span className="text-sm text-slate-400">Aggregating Community Updates...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 feed-container">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Community Collaboration Feed</h2>
        <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">Engage with fellow citizen reporters, save alerts, and follow resolving officers.</p>
      </div>

      {incidents.map((incident) => {
        const isSelf = incident.reportedBy === currentUser?.email;
        const isFollowed = following.includes(incident.reportedBy);
        const isBookmarked = savedIds.includes(incident.id);
        const isAnon = incident.anonymous;

        return (
          <Card key={incident.id} className="feed-card bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-850 p-5 shadow-xl space-y-4">
            
            {/* Header: Citizen Profile Card */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img 
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${isAnon ? 'Anonymous_Citizen' : (incident.reportedBy || 'Guest')}`} 
                  alt="Reporter avatar" 
                  onClick={() => !isAnon && navigate(`/profile/${incident.reportedBy}`)}
                  className={`w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5 shrink-0 ${!isAnon ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                />
                <div>
                  <span 
                    onClick={() => !isAnon && navigate(`/profile/${incident.reportedBy}`)}
                    className={`block text-xs font-bold text-slate-850 dark:text-slate-200 ${!isAnon ? 'cursor-pointer hover:underline hover:text-emerald-500 transition-colors' : ''}`}
                  >
                    {isAnon ? 'Anonymous Citizen' : (incident.reportedBy?.split('@')[0] || 'Citizen')}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-semibold">
                    <Globe size={11} className="text-slate-400 dark:text-slate-600" />
                    {new Date(incident.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Follow Button */}
              {!isSelf && !isAnon && (
                <button
                  onClick={() => handleFollowToggle(incident.reportedBy)}
                  className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-all duration-200 ${
                    isFollowed 
                      ? 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800' 
                      : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-500 hover:text-slate-950 hover:border-transparent'
                  }`}
                >
                  {isFollowed ? (
                    <>
                      <UserMinus size={12} />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus size={12} />
                      Follow
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Incident Details Body */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusColor(incident.status)}`}>
                  {incident.status}
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-850">
                  {incident.category || 'CIVIC_ISSUE'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{incident.title}</h3>
              <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">{incident.description}</p>
            </div>

            {/* Incident Media */}
            {incident.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-850/80 bg-slate-50 dark:bg-slate-950">
                <img 
                  src={incident.imageUrl} 
                  alt={incident.title} 
                  className="w-full h-80 object-cover hover:scale-[1.01] transition-transform duration-500"
                />
              </div>
            )}

            {/* Address */}
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold">
              <MapPin size={11} className="text-emerald-500/80" />
              {incident.location?.address || 'City Limits'}
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-slate-150 dark:bg-slate-850/40 w-full" />

            {/* Action Bar */}
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-450 px-1 relative">
              <button 
                onClick={() => handleSupportToggle(incident.id)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-all duration-200 ${
                  Array.isArray(incident.supportedBy) && incident.supportedBy.includes(currentUser?.email)
                    ? 'text-emerald-500 hover:text-emerald-400 scale-105' 
                    : 'text-slate-500 hover:text-emerald-500 dark:text-slate-450 dark:hover:text-emerald-400'
                }`}
              >
                <ThumbsUp 
                  size={16} 
                  className={
                    Array.isArray(incident.supportedBy) && incident.supportedBy.includes(currentUser?.email) 
                      ? 'fill-emerald-500/20 stroke-[2.5px]' 
                      : ''
                  } 
                />
                <span>Support ({incident.supportCount || 0})</span>
              </button>

              <button 
                onClick={() => toggleCommentsDrawer(incident.id)}
                className={`flex items-center gap-1.5 text-xs font-bold hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-200 ${
                  activeCommentIncidentId === incident.id ? 'text-emerald-600 dark:text-emerald-400' : ''
                }`}
              >
                <MessageSquare size={16} />
                <span>Comments</span>
              </button>

              <button 
                onClick={() => handleSaveToggle(incident.id)}
                className={`flex items-center gap-1.5 text-xs font-bold hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-200 ${
                  isBookmarked ? 'text-emerald-600 dark:text-emerald-400' : ''
                }`}
              >
                <Bookmark size={16} />
                <span>{isBookmarked ? 'Saved' : 'Save'}</span>
              </button>

              {/* Share dropdown trigger */}
              <div className="relative">
                <button 
                  onClick={() => setShareDropdownId(shareDropdownId === incident.id ? null : incident.id)}
                  className="flex items-center gap-1.5 text-xs font-bold hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-200"
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>

                {shareDropdownId === incident.id && (
                  <div className="absolute right-0 bottom-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 flex flex-col gap-1 shadow-2xl z-20 w-32 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <button 
                      onClick={() => handleShareClick(incident.id, 'copy')}
                      className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 w-full text-left"
                    >
                      <Copy size={12} />
                      Copy Link
                    </button>
                    <button 
                      onClick={() => handleShareClick(incident.id, 'twitter')}
                      className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 w-full text-left"
                    >
                      <Twitter size={12} />
                      Twitter / X
                    </button>
                    <button 
                      onClick={() => handleShareClick(incident.id, 'linkedin')}
                      className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 w-full text-left"
                    >
                      <Linkedin size={12} />
                      LinkedIn
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Drawer (Reddit-style nested replies) */}
            {activeCommentIncidentId === incident.id && (
              <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-850/40 animate-in slide-in-from-top-3 duration-300">
                {/* Form to submit top-level comment */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                  <Button
                    onClick={() => handlePostComment(incident.id)}
                    disabled={submittingComment || !newCommentText.trim()}
                    className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl"
                  >
                    {submittingComment ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                  </Button>
                </div>

                {/* Recursive Nested Comments list */}
                <CommentsList 
                  comments={commentsMap[incident.id] || []} 
                  incidentId={incident.id}
                  onCommentAdded={(newComment) => {
                    setCommentsMap(prev => ({
                      ...prev,
                      [incident.id]: [...(prev[incident.id] || []), newComment]
                    }));
                  }}
                  onCommentLiked={async (commentId) => {
                    await likeComment(commentId);
                    // Update like counts locally
                    setCommentsMap(prev => {
                      const updated = (prev[incident.id] || []).map(c => {
                        if (c.id === commentId) {
                          const liked = c.likedBy || [];
                          const hasLiked = liked.contains ? liked.contains(currentUser.userId) : liked.includes(currentUser.userId);
                          const newLiked = hasLiked 
                            ? liked.filter(id => id !== currentUser.userId)
                            : [...liked, currentUser.userId];
                          return { ...c, likedBy: newLiked, likesCount: newLiked.length };
                        }
                        return c;
                      });
                      return { ...prev, [incident.id]: updated };
                    });
                  }}
                />
              </div>
            )}

          </Card>
        );
      })}
    </div>
  );
}
