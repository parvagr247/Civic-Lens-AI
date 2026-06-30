import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/auth/Auth.css';
import { register } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Shield, Sparkles, Loader2, User, Mail, Lock, CheckSquare, Square, ArrowLeft } from 'lucide-react';
import { useToast } from '../components/ui/ToastProvider';

/**
 * Register page component.
 * Registers citizens and admin accounts.
 */
export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminRole, setIsAdminRole] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all registration fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await register(name, email, password, isAdminRole);
      if (response.success) {
        toast('Account registered successfully!', 'success');
        if (response.data.role === 'ROLE_ADMIN') {
          navigate('/admin-dashboard');
        } else if (response.data.role === 'ROLE_OFFICER') {
          navigate('/officer-dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Email might already be taken.');
      toast('Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b19] relative overflow-hidden p-4">
      {/* Visual background lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Back to Home Link */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors duration-200 bg-slate-900/40 backdrop-blur-sm border border-slate-850 px-3.5 py-2 rounded-xl z-20"
      >
        <ArrowLeft size={14} />
        Back to Home
      </Link>

      <Card className="w-full max-w-md p-6 bg-slate-900/50 backdrop-blur-md border-slate-800 shadow-2xl relative z-10 space-y-6">
        
        {/* Logo and Title */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 rounded-2xl flex items-center justify-center">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5 justify-center">
            Register Account
            <Sparkles size={16} className="text-emerald-400" />
          </h2>
          <p className="text-xs text-slate-400 max-w-[280px]">
            Join the platform to audit infrastructure and earn rewards
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-400 text-xs font-semibold animate-pulse text-center">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:border-emerald-500/50 focus:ring-0 focus:outline-none transition-colors duration-200"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@civiclens.gov"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:border-emerald-500/50 focus:ring-0 focus:outline-none transition-colors duration-200"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:border-emerald-500/50 focus:ring-0 focus:outline-none transition-colors duration-200"
                disabled={loading}
              />
            </div>
          </div>

          {/* Admin Role Simulation checkbox */}
          <div 
            onClick={() => !loading && setIsAdminRole(!isAdminRole)}
            className="flex items-center gap-2.5 cursor-pointer py-1 select-none"
          >
            <div className="text-emerald-400">
              {isAdminRole ? <CheckSquare size={18} /> : <Square size={18} className="text-slate-650" />}
            </div>
            <span className="text-xs text-slate-350 font-medium">
              Register as Municipal Official (Admin simulation)
            </span>
          </div>

          <Button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating Profile...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:underline font-semibold">
              Sign In
            </Link>
          </p>
        </div>

      </Card>
    </div>
  );
}
