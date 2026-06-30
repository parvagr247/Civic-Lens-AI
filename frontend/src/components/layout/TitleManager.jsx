import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Route-to-Title Mapper helper.
 */
const getTitleForPath = (pathname) => {
  const path = pathname.toLowerCase();
  
  if (path === '/') return 'CivicLens AI – Smart Civic Issue Reporting';
  if (path === '/dashboard') return 'Dashboard • CivicLens AI';
  if (path === '/analyze') return 'Report Issue • CivicLens AI';
  if (path === '/track') return 'Track Report • CivicLens AI';
  if (path === '/feed') return 'Community Feed • CivicLens AI';
  if (path === '/intelligence') return 'City Intelligence • CivicLens AI';
  if (path === '/risk-intelligence') return 'Risk Intelligence • CivicLens AI';
  if (path === '/settings') return 'Settings • CivicLens AI';
  if (path === '/login') return 'Login • CivicLens AI';
  if (path === '/register') return 'Create Account • CivicLens AI';
  
  // Administrative and Officer Dashboards
  if (path === '/admin-dashboard') return 'Admin Dashboard • CivicLens AI';
  if (path === '/departments') return 'Department Analytics • CivicLens AI';
  if (path === '/ai-insights') return 'AI Insights • CivicLens AI';
  if (path === '/moderation') return 'Community Moderation • CivicLens AI';
  if (path === '/officer-dashboard') return 'Officer Dashboard • CivicLens AI';
  
  // Prefix matches for dynamic routing
  if (path.startsWith('/incidents/')) return 'Incident Details • CivicLens AI';
  if (path.startsWith('/profile/')) return 'My Profile • CivicLens AI';
  
  return 'Page Not Found • CivicLens AI';
};

/**
 * TitleManager Component.
 * Listens to location transitions and syncs page titles automatically.
 */
export default function TitleManager() {
  const location = useLocation();

  useEffect(() => {
    document.title = getTitleForPath(location.pathname);
  }, [location.pathname]);

  return null;
}
