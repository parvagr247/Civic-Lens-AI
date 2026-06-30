import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/ToastProvider';
import { getCurrentUser } from '../services/authService';
import { getProfile, updateProfile } from '../services/profileService';
import { followUser, unfollowUser } from '../services/collaborationService';
import { 
  User, Award, CheckCircle, MessageSquare, Calendar, 
  MapPin, Users, Edit3, Lock, Shield, Eye, Activity, Heart
} from 'lucide-react';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const loggedInUser = getCurrentUser();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isSelf, setIsSelf] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editCoverImageUrl, setEditCoverImageUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Sub-tab State: 'reports', 'comments', 'badges'
  const [activeSubTab, setActiveSubTab] = useState('reports');

  // Hardcoded System Achievements List to display as locked/unlocked
  const SYSTEM_ACHIEVEMENTS = [
    {
      id: 'first_report',
      title: 'First Report',
      description: 'Reported your first smart city incident.',
      icon: 'Award',
      badge: 'Bronze',
      xp: 20
    },
    {
      id: 'five_reports',
      title: 'Civic Reporter',
      description: 'Submitted 5+ incidents to clean and improve the city.',
      icon: 'Shield',
      badge: 'Silver',
      xp: 50
    },
    {
      id: 'first_resolved',
      title: 'Issue Solved',
      description: 'First reported incident successfully resolved and verified.',
      icon: 'CheckCircle',
      badge: 'Silver',
      xp: 40
    },
    {
      id: 'safety_hero',
      title: 'Safety Hero',
      description: 'Earned 100+ points and helped improve city-wide safety.',
      icon: 'Award',
      badge: 'Gold',
      xp: 100
    }
  ];

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // If no userId in URL, default to current logged in user
      const targetUserId = userId || loggedInUser?.userId;
      if (!targetUserId) {
        toast('User ID not specified', 'error');
        navigate('/dashboard');
        return;
      }

      setIsSelf(targetUserId === loggedInUser?.userId);

      const response = await getProfile(targetUserId);
      if (response.success && response.data) {
        setProfileData(response.data);
        setIsFollowing(response.data.isFollowing || false);
        setFollowersCount(response.data.followerCount || 0);

        // Prefill edit states
        setEditName(response.data.profile.name || '');
        setEditBio(response.data.profile.bio || '');
        setEditAvatarUrl(response.data.profile.avatarUrl || '');
        setEditCoverImageUrl(response.data.profile.coverImageUrl || '');
      }
    } catch (err) {
      console.error(err);
      toast('Failed to load citizen profile details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      const email = profileData.profile.userId; // target user
      // Note: followUser endpoint expects email parameter which corresponds to the target profile
      // In our ProfileController, we load profile user's email or fallback
      // Since followUser accepts targetEmail, let's pass targetEmail. We can obtain targetEmail from reportedIncidents
      // Or fallback to citizen email.
      const targetEmail = profileData.profile.name + "@mail.com"; // default placeholder, or let's find it in their reports
      const reports = profileData.reportedIncidents || [];
      const resolvedEmail = reports.length > 0 ? reports[0].reportedBy : `${profileData.profile.name}@mail.com`;

      if (isFollowing) {
        await unfollowUser(resolvedEmail);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast(`Unfollowed ${profileData.profile.name}`, 'info');
      } else {
        await followUser(resolvedEmail);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast(`Following ${profileData.profile.name}!`, 'success');
      }
    } catch (err) {
      console.error(err);
      toast('Failed to perform follow action.', 'error');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const response = await updateProfile({
        name: editName,
        bio: editBio,
        avatarUrl: editAvatarUrl,
        coverImageUrl: editCoverImageUrl
      });

      if (response.success) {
        toast('Profile updated successfully!', 'success');
        setShowEditModal(false);
        fetchUserProfile();
      }
    } catch (err) {
      console.error(err);
      toast('Failed to save profile modifications.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Helper to calculate XP bar percentage
  const getXpProgress = (points) => {
    let base = 0;
    let nextTier = 50;
    if (points >= 2000) { base = 2000; nextTier = 3000; }
    else if (points >= 1000) { base = 1000; nextTier = 2000; }
    else if (points >= 600) { base = 600; nextTier = 1000; }
    else if (points >= 300) { base = 300; nextTier = 600; }
    else if (points >= 150) { base = 150; nextTier = 300; }
    else if (points >= 50) { base = 50; nextTier = 150; }

    const numerator = points - base;
    const denominator = nextTier - base;
    return Math.min(100, Math.max(0, Math.round((numerator / denominator) * 100)));
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="flex gap-4 items-center">
          <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 -mt-12 ml-6 border-4 border-slate-900" />
          <div className="space-y-2 flex-1 pt-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 w-1/4 rounded" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 w-2/4 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <User className="w-16 h-16 mx-auto text-slate-500" />
        <h3 className="text-lg font-black">Citizen Profile Not Found</h3>
        <p className="text-xs text-slate-400">The profile you are looking for does not exist or has been archived.</p>
        <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }

  const { profile, reportedIncidents, comments } = profileData;
  const progressPercent = getXpProgress(profile.points || 0);

  return (
    <div className="max-w-5xl mx-auto pb-12 text-slate-900 dark:text-slate-100 space-y-6 animate-fade-in">
      
      {/* Cover and Avatar Section */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-855 bg-slate-100 dark:bg-slate-900 shadow-md">
        <div className="h-48 md:h-64 overflow-hidden relative">
          <img 
            src={profile.coverImageUrl || "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1200&auto=format&fit=crop"} 
            alt="Profile Cover" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1200&auto=format&fit=crop";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
        </div>

        {/* Profile Card Header overlay */}
        <div className="p-6 pt-0 flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 sm:-mt-20 relative z-10 text-center sm:text-left">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-slate-50 dark:border-slate-900 bg-slate-800 shadow-xl shrink-0">
            <img 
              src={profile.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"} 
              alt={profile.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150";
              }}
            />
          </div>

          <div className="flex-1 space-y-1 pt-2 sm:pt-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-905 dark:text-white">{profile.name}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-slate-550 dark:text-slate-400 mt-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase">
                    {profile.level}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-550 border border-blue-500/20 text-[10px] font-black uppercase">
                    Rank #{profile.rank || 99}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-emerald-500" />
                    {profile.city || 'Portland'}, {profile.state || 'Oregon'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-2 sm:mt-0 justify-center">
                {isSelf ? (
                  <Button 
                    onClick={() => setShowEditModal(true)}
                    className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs py-1.5 px-4 rounded-xl flex items-center gap-1.5"
                  >
                    <Edit3 size={14} />
                    Edit Profile
                  </Button>
                ) : (
                  <Button 
                    onClick={handleFollowToggle}
                    className={`font-black text-xs py-1.5 px-5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all ${
                      isFollowing 
                        ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700' 
                        : 'bg-emerald-500 text-slate-950 hover:bg-emerald-450'
                    }`}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow Contributor'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bio Text */}
        <div className="px-6 pb-6 pt-3 border-t border-slate-100 dark:border-slate-855/50 text-slate-600 dark:text-slate-350 text-xs text-center sm:text-left leading-relaxed">
          {profile.bio || "No biography provided. Edit your profile to write a custom biography."}
        </div>
      </div>

      {/* Stats Cards & XP tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Stats Info Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-250 dark:border-slate-855 space-y-4 shadow-sm">
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-450 border-b border-slate-100 dark:border-slate-855 pb-2">
              Citizen Reputation
            </h3>

            <div className="space-y-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 rounded-2xl text-center">
                <span className="text-[10px] text-slate-450 uppercase font-extrabold block">Contribution Score</span>
                <span className="text-2xl font-black text-emerald-500 mt-1 block">{profile.points} XP</span>
              </div>
            </div>

            {/* XP progress bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>XP Level Progression</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
              <span className="text-[9px] text-slate-450 block italic text-center">
                Earn points by reporting & verifying issues to unlock the next tier!
              </span>
            </div>

            {/* Followers / Following counts */}
            <div className="flex justify-around items-center border-t border-slate-100 dark:border-slate-855 pt-3 text-center">
              <div>
                <span className="text-base font-black text-slate-800 dark:text-white">{followersCount}</span>
                <span className="text-[10px] text-slate-450 uppercase font-bold block">Followers</span>
              </div>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
              <div>
                <span className="text-base font-black text-slate-800 dark:text-white">{profileData.followingCount || 0}</span>
                <span className="text-[10px] text-slate-450 uppercase font-bold block">Following</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white dark:bg-slate-900/30 border-slate-250 dark:border-slate-855 space-y-4 shadow-sm">
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-450 border-b border-slate-100 dark:border-slate-855 pb-2">
              Contribution Metrics
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Reports Submitted</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{profile.reportsSubmitted || 0} Issues</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Reports Resolved</span>
                <span className="font-extrabold text-emerald-500">{profile.reportsResolved || 0} Resolved</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Helpful Commentary Logs</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{comments.length} Comments</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Tabbed Details View (Reports, Comments, Badges) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 pb-px overflow-x-auto scrollbar-none">
            {[
              { id: 'reports', label: 'Reported Issues' },
              { id: 'comments', label: 'Comments' },
              { id: 'badges', label: 'Badge Showcase' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeSubTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            
            {/* Reports List Tab */}
            {activeSubTab === 'reports' && (
              <div className="space-y-3 animate-fade-in">
                {reportedIncidents.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs font-bold">
                    No public reports submitted by this user.
                  </div>
                ) : (
                  reportedIncidents.map((incident) => (
                    <Card 
                      key={incident.id} 
                      onClick={() => navigate(`/incidents/${incident.id}`)}
                      className="p-4 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 hover:border-emerald-500/35 cursor-pointer transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            incident.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                            incident.status === 'CLOSED' ? 'bg-slate-500/10 text-slate-500 border border-slate-500/20' :
                            'bg-amber-500/10 text-amber-550 border border-amber-500/20'
                          }`}>
                            {incident.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{incident.category}</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white leading-snug">{incident.title}</h4>
                        <div className="text-[9px] text-slate-500 flex items-center gap-1.5">
                          <Calendar size={10} />
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="text-xs text-emerald-500 font-bold flex items-center gap-1 shrink-0">
                        View Details
                        <Eye size={12} />
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Comments List Tab */}
            {activeSubTab === 'comments' && (
              <div className="space-y-3 animate-fade-in">
                {comments.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs font-bold">
                    No public comments posted by this citizen.
                  </div>
                ) : (
                  comments.map((comment) => (
                    <Card 
                      key={comment.id}
                      onClick={() => navigate(`/incidents/${comment.incidentId}`)}
                      className="p-4 bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-855 hover:border-emerald-500/35 cursor-pointer transition-all duration-200 space-y-2"
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-bold flex items-center gap-1">
                          <MessageSquare size={10} className="text-emerald-500" />
                          Commented on Incident
                        </span>
                        <span className="text-slate-400 font-mono">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                        "{comment.content}"
                      </p>
                      {comment.likesCount > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Heart size={10} className="text-rose-500 fill-rose-500" />
                          {comment.likesCount} likes
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Badges / Achievements Showcase */}
            {activeSubTab === 'badges' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                {SYSTEM_ACHIEVEMENTS.map((badge) => {
                  const isUnlocked = profile.unlockedAchievements?.includes(badge.id);
                  return (
                    <Card 
                      key={badge.id}
                      className={`p-4 border transition-all duration-200 relative overflow-hidden flex gap-3.5 items-start ${
                        isUnlocked 
                          ? 'bg-gradient-to-r from-emerald-500/5 to-emerald-500/[0.01] border-emerald-500/30 text-slate-800 dark:text-white' 
                          : 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-855 opacity-60'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl border shrink-0 ${
                        isUnlocked 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-750'
                      }`}>
                        {badge.id === 'first_resolved' ? <CheckCircle size={20} /> : <Award size={20} />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-black leading-none">{badge.title}</h4>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                            badge.badge === 'Gold' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            badge.badge === 'Silver' ? 'bg-slate-350/20 text-slate-500 border border-slate-350/30' :
                            'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                          }`}>
                            {badge.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">{badge.description}</p>
                        <span className="text-[9px] font-mono text-emerald-500 block font-bold">+{badge.xp} XP Points Reward</span>
                      </div>

                      {!isUnlocked && (
                        <div className="absolute top-2 right-2 text-slate-400" title="Locked">
                          <Lock size={12} />
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="border-b border-slate-100 dark:border-slate-855 pb-2">
              <h3 className="text-sm font-black uppercase tracking-wider">Edit Profile Settings</h3>
              <p className="text-[10px] text-slate-500">Configure your citizen identifier credentials.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold block">Display Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold block">Biography</label>
                <textarea 
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-50 dark:bg-slate-955/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold block">Avatar Image URL</label>
                <input 
                  type="text" 
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-[10px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold block">Cover Image URL</label>
                <input 
                  type="text" 
                  value={editCoverImageUrl}
                  onChange={(e) => setEditCoverImageUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-[10px]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-855">
                <Button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-300 font-bold py-1.5 px-4 rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  loading={savingProfile}
                  className="bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-black py-1.5 px-5 rounded-xl"
                >
                  Save Settings
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
