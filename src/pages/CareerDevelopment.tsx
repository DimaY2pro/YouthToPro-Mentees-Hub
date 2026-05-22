import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { logout } from '../lib/firebase';

type StatusType = 'Not Started' | 'In Progress' | 'Completed';

function StatusBadge({ status, onChange }: { status: StatusType, onChange?: (status: StatusType) => void }) {
  const cycleStatus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onChange) return;

    if (status === 'Not Started') onChange('In Progress');
    else if (status === 'In Progress') onChange('Completed');
    else onChange('Not Started');
  };

  let badgeClasses = "bg-slate-600/90 text-white";
  let icon = <span className="material-symbols-outlined text-[14px]">radio_button_unchecked</span>;

  if (status === 'In Progress') {
    badgeClasses = "bg-[#F3B557] text-[#183B68]";
    icon = <span className="material-symbols-outlined text-[14px]">schedule</span>;
  } else if (status === 'Completed') {
    badgeClasses = "bg-[#7EC5B3] text-[#183B68]";
    icon = <span className="material-symbols-outlined text-[14px]">check_circle</span>;
  }

  return (
    <div 
      onClick={cycleStatus}
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 w-[115px] h-[26px] rounded-md text-xs font-bold backdrop-blur-sm border border-white/10 shadow-sm hover:scale-105 transition-all ${badgeClasses}`}
      title="Click to change status"
    >
      {icon}
      <span>{status}</span>
    </div>
  );
}

interface CareerDevelopmentProps {
  user: User | null;
}

export default function CareerDevelopment({ user }: CareerDevelopmentProps) {
  const [moduleStatuses, setModuleStatuses] = useState<Record<string, StatusType>>({
    intent: 'Not Started',
    cv: 'Not Started',
    swot: 'Not Started',
    path: 'Not Started',
    mock: 'Not Started',
    mentoring: 'Not Started',
    interview: 'Not Started'
  });

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    }
  };

  const updateStatus = (key: string, status: StatusType) => {
    setModuleStatuses(prev => ({ ...prev, [key]: status }));
  };

  const completedModulesCount = Object.values(moduleStatuses).filter(s => s === 'Completed').length;
  const totalModules = Object.keys(moduleStatuses).length;
  const completionPercentage = (completedModulesCount / totalModules) * 100;


  return (
    <div className="flex h-screen w-full overflow-hidden">
      <aside className="hidden md:flex w-64 bg-[#183B68] dark:bg-[#15202b] border-r border-[#183B68]/10 dark:border-slate-800 flex-col justify-between h-full p-4 shrink-0 transition-colors duration-200 text-white">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10 dark:border-slate-800">
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 shadow-sm ring-2 ring-white/20 dark:ring-slate-700" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAe-ZN7-JOKWieog_pNiPwtzrKnUeuXQ4fc-oY08SkAc65AV-KaF2rby-y3GSAcXpYUv7L8q9jFLPGyFdykIU8jy9k8_hp9iRwU30k0hzkJU0lB-haPQN6DGprvs5FFnifo5pbj-Ur0vhK-71lTMlaOLAF4WdttwJKKvzCloRdfxh6EdVlPtvW7-JGnMXMJsYji2X8cszZE-UbkhwxOj6DJ_ys-CYpmmBbMWqqFqPusg7lFdTfKekDLiM8yEJzbhfNHyGllqPmQ3L8")'}}></div>
            <div className="flex flex-col">
              <h1 className="text-white dark:text-white text-sm font-bold leading-normal">{user.displayName || user.email?.split('@')[0] || 'Mentee'}</h1>
              <p className="text-white/60 dark:text-slate-400 text-xs font-normal leading-normal">Mentee Program YouthToPro</p>
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-800 transition-colors group" to="/">
              <span className="material-symbols-outlined text-white/60 group-hover:text-[#F3B557] dark:text-slate-400 dark:group-hover:text-[#F3B557] transition-colors">home</span>
              <span className="text-sm font-medium">Home</span>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#F3B557] dark:bg-primary/20 text-[#183B68] transition-colors" to="/modules">
              <span className="material-symbols-outlined fill-1">work</span>
              <span className="text-sm font-bold">Career Modules</span>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-800 transition-colors group" to="/modules">
              <span className="material-symbols-outlined text-white/60 group-hover:text-[#F3B557] dark:text-slate-400 dark:group-hover:text-[#F3B557] transition-colors">person</span>
              <span className="text-sm font-medium">Profile</span>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-800 transition-colors group" to="/modules">
              <span className="material-symbols-outlined text-white/60 group-hover:text-[#F3B557] dark:text-slate-400 dark:group-hover:text-[#F3B557] transition-colors">settings</span>
              <span className="text-sm font-medium">Account Setting</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-800 transition-colors group text-left w-full mt-4">
              <span className="material-symbols-outlined text-white/60 group-hover:text-red-400 dark:text-slate-400 dark:group-hover:text-red-400 transition-colors">logout</span>
              <span className="text-sm font-medium group-hover:text-red-400">Log out</span>
            </button>
          </nav>
        </div>
        <button disabled className="flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-[#7EC5B3]/50 cursor-not-allowed text-white/50 text-sm font-bold leading-normal transition-colors shadow-sm">
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span className="truncate">New Goal</span>
        </button>
      </aside>

      {/* Mobile nav header for when sidebar is hidden */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-[#183B68] flex items-center justify-between px-4 z-50">
        <h1 className="text-white font-bold">YouthToPro</h1>
        <button onClick={handleLogout} className="text-white/80 hover:text-white">
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>

      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark relative pt-16 md:pt-0">
        <div className="max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-8">
          <header className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[#183B68] dark:text-white text-2xl md:text-3xl font-black tracking-tight">Career Development Modules</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg font-normal max-w-2xl">
              Track your progress through the YouthToPro curriculum and build your professional toolkit step-by-step.
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-3 rounded-xl p-6 bg-white dark:bg-[#15202b] border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#7EC5B3]/20 dark:bg-[#7EC5B3]/30 rounded-lg text-[#183B68]">
                  <span className="material-symbols-outlined">school</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Modules Completed</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-[#183B68] dark:text-white text-3xl font-bold">{completedModulesCount}/{totalModules}</p>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                <div className="bg-[#F3B557] h-1.5 rounded-full transition-all duration-300" style={{ width: `${completionPercentage}%` }}></div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 rounded-xl p-6 bg-white dark:bg-[#15202b] border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#F3B557]/20 dark:bg-[#F3B557]/30 rounded-lg text-[#183B68]">
                  <span className="material-symbols-outlined">rate_review</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Pending Reviews</p>
              </div>
              <p className="text-[#183B68] dark:text-white text-3xl font-bold">1</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">CV Builder awaiting mentor feedback</p>
            </div>
            
            <div className="flex flex-col gap-3 rounded-xl p-6 bg-white dark:bg-[#15202b] border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#7EC5B3]/20 dark:bg-[#7EC5B3]/30 rounded-lg text-[#183B68]">
                  <span className="material-symbols-outlined">event</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Upcoming Sessions</p>
              </div>
              <p className="text-[#183B68] dark:text-white text-3xl font-bold">2</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">Next: Mock Interview on Thursday</p>
            </div>
          </section>

          <div className="flex items-center justify-between pt-4">
            <h3 className="text-[#183B68] dark:text-white text-xl font-bold">Your Modules</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <button className="whitespace-nowrap px-3 py-1.5 text-sm font-medium text-[#183B68] dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">All</button>
              <button className="whitespace-nowrap px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-[#183B68] dark:hover:text-white transition-colors">In Progress</button>
              <button className="whitespace-nowrap px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-[#183B68] dark:hover:text-white transition-colors">Completed</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
            <div className="group relative flex flex-col gap-3 rounded-xl overflow-hidden aspect-[4/3] shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDDQg4h-WGy59XrwMI7ow7u0ivHiKJlPyfgKD592EUxObk-MdFuQx2tzVFjO5enxAA9srS4kZ6B0XVihPrLmLLzy8L9Py5DMgJRf6bD6opaEWagh5vGIFF71pGJF43n-S5r3A_8-anW0cWQTRFJ-bLTfowDHNhcoPPWNbuHLciP83mP9D1UGlPVIcAn600tQWiC_6W0G3QZVhuPtbOn3J6tLte0mH6fErdPq-GOcwbg26_uXRp6B8X8vore7X3ks4wkepOIhc4KjqM")' }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#183B68]/95 via-[#183B68]/40 to-[#183B68]/10"></div>
              <div className="absolute top-3 right-3 z-10">
                <StatusBadge status={moduleStatuses.intent} onChange={(status) => updateStatus('intent', status)} />
              </div>
              <div className="relative flex flex-col justify-end h-full p-5 gap-1">
                <div className="mb-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="material-symbols-outlined text-[#183B68] bg-[#7EC5B3] p-2 rounded-full backdrop-blur-sm">description</span>
                </div>
                <h4 className="text-white text-lg font-bold leading-tight">Letter of Intent Builder</h4>
                <p className="text-slate-200 text-xs line-clamp-2">Craft a compelling narrative for your applications.</p>
              </div>
            </div>

            <div className="group relative flex flex-col gap-3 rounded-xl overflow-hidden aspect-[4/3] shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAM2soMdA0MgqOrk2K7tFDa0WN2GLJRCavW8CUgK0UdMVTqkZThNxI28feL9NTrmf5p57aR5k-aINzZyHArURCDeB92erVDAri3-N6oKyVBPeJEFl1C9dnFla0osccZTvWwfzCw324ITAX61FmHWA_aRhxuSxvCoofwOlUT3l9VSg-hzAaR1_1-_O-X-JJS3MpDLqZZXaK5y98tWu77_1zzUBenbYxL4UVacaj6wASu0HB5qd8UNM4UgR9BwogA3gHqBv9lGO09mlg")' }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#183B68]/95 via-[#183B68]/40 to-[#183B68]/10"></div>
              <div className="absolute top-3 right-3 z-10">
                <StatusBadge status={moduleStatuses.cv} onChange={(status) => updateStatus('cv', status)} />
              </div>
              <div className="relative flex flex-col justify-end h-full p-5 gap-1">
                <div className="mb-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="material-symbols-outlined text-[#183B68] bg-[#7EC5B3] p-2 rounded-full backdrop-blur-sm">badge</span>
                </div>
                <h4 className="text-white text-lg font-bold leading-tight">CV Builder</h4>
                <p className="text-slate-200 text-xs line-clamp-2">Structure your experience effectively.</p>
              </div>
            </div>

            <div 
              onClick={() => window.open("https://swot-ai-git-codex-fix-api-fetch-b0898c-dima-kandalafts-projects.vercel.app", "_blank", "noopener,noreferrer")}
              className="group relative flex flex-col gap-3 rounded-xl overflow-hidden aspect-[4/3] shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
            >
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDGh4xkDrljLNHsB663vButDGeJawxUGdc-tFaArziGONpzVeI1KRHGR8dHiFfOio5c1sTd4RdycJhzTEzR6QHLUAaYPSkdAETwJ7HuyZZnCQMEzrTs8-RTU3pQYKZKC0b9F3b9lq8uJ0C_-1wCDGOKkoS9TLYCICRw67bQoWLebdTKsCbBKFoflUtFv28p_CFh3FbVpfiI_fuP-dUW0gWzAiUbFISGyhlEO-1HgFJ8ET5IGXpNfDiLYkqFpmCgoEjlDdFk3CwC_L8")' }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#183B68]/95 via-[#183B68]/40 to-[#183B68]/10"></div>
              <div className="absolute top-3 right-3 z-10">
                <StatusBadge status={moduleStatuses.swot} onChange={(status) => updateStatus('swot', status)} />
              </div>
              <div className="relative flex flex-col justify-end h-full p-5 gap-1">
                <div className="mb-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="material-symbols-outlined text-[#183B68] bg-[#7EC5B3] p-2 rounded-full backdrop-blur-sm">grid_view</span>
                </div>
                <h4 className="text-white text-lg font-bold leading-tight">SWOT Analysis</h4>
                <p className="text-slate-200 text-xs line-clamp-2">Identify your strengths, weaknesses, opportunities, and threats.</p>
              </div>
            </div>

            <div className="group relative flex flex-col gap-3 rounded-xl overflow-hidden aspect-[4/3] shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB9BNT9bm0QYx-fdoM2eB89ZfbyzILz7J8P1EaxC5y0GIqQcwovEkowOVhB1TDxpCTXYciXLpCmbpnL2wuyW7ZYB68CESO4-Pu4VwxL8tqFxCEJwUWz1EhtKMB4Xc1JUYk1JuqJpJlNwQLd1vYIK2yahZUFSjUwCBUeGGh4KMABeSg1MHpeXeNurXKUIw-qj8pgr-Ym_IXkp1lzZ0BpuGhiCskYnBRZNuyKStlw-qBu9YPZlnk_V3wQLgtx7BDQXu5fAKlfO2O7c_0")' }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#183B68]/95 via-[#183B68]/40 to-[#183B68]/10"></div>
              <div className="absolute top-3 right-3 z-10">
                <StatusBadge status={moduleStatuses.path} onChange={(status) => updateStatus('path', status)} />
              </div>
              <div className="relative flex flex-col justify-end h-full p-5 gap-1">
                <div className="mb-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="material-symbols-outlined text-[#183B68] bg-[#7EC5B3] p-2 rounded-full backdrop-blur-sm">map</span>
                </div>
                <h4 className="text-white text-lg font-bold leading-tight">Career Path Builder</h4>
                <p className="text-slate-200 text-xs line-clamp-2">Visualizing your long-term career trajectory.</p>
              </div>
            </div>

            <div 
              onClick={() => window.open("https://ai-mock.youthtoprofessionals.org", "_blank", "noopener,noreferrer")}
              className="group relative flex flex-col gap-3 rounded-xl overflow-hidden aspect-[4/3] shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
            >
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDd7hH1pSuBFj5uKUCyjtxy4DewDDoPNs9dA2bEDyRlOX7OskAB1c_2y6lM4dKNbepW6YVeORfHKkQ4OFxyy5a42Bk4k3DszvoLqIfjq7xyD3CN7eBYnafJGfOM3Dxb_YF8HMkuCsC7lCeaeoKc0Ng2BpnxJ41utIguKfoy4RHGX-ro5ycd-jGegudFzqs-0wv4WmZ2v928tJIMVhnaW8yqY-DS4JgqJTLQnsxXdyqVlTpHcgpweJBDcZHkyLWZUyLBQxFCM7QyOPw")' }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#183B68]/95 via-[#183B68]/40 to-[#183B68]/10"></div>
              <div className="absolute top-3 right-3 z-10">
                <StatusBadge status={moduleStatuses.mock} onChange={(status) => updateStatus('mock', status)} />
              </div>
              <div className="relative flex flex-col justify-end h-full p-5 gap-1">
                <div className="mb-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="material-symbols-outlined text-[#183B68] bg-[#7EC5B3] p-2 rounded-full backdrop-blur-sm">psychology</span>
                </div>
                <h4 className="text-white text-lg font-bold leading-tight">AI Mock Interview</h4>
                <p className="text-slate-200 text-xs line-clamp-2">Practice with our advanced AI interviewer.</p>
              </div>
            </div>

            <div className="group relative flex flex-col gap-3 rounded-xl overflow-hidden aspect-[4/3] shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDwxucgFw-NZdmpZrJaniAKCXoqB_TRLSPBX-9UIY6mh-qMfGD1NpFDJNPZFKwRz_D5M1H7txM7S_a9UCfn2IiO7_PFvKGHVYtAOGm4bMZsG46L5PhaOQTZn_Eh-by9_NwkpdCcm3epFrcXRe32AfpmcbGlRExtPVcK_W_eVu7ZtIfgmEzXVwUc8ykcRMwvd3FAkr1EuSDAzHE0ZqjlmIHTpJe3shGJ7hG59UhawGx4ipsAlrdbgieNEBS4ZyFyIcqh1yC4rW-yXzI")' }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#183B68]/95 via-[#183B68]/40 to-[#183B68]/10"></div>
              <div className="absolute top-3 right-3 z-10">
                <StatusBadge status={moduleStatuses.mentoring} onChange={(status) => updateStatus('mentoring', status)} />
              </div>
              <div className="relative flex flex-col justify-end h-full p-5 gap-1">
                <div className="mb-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="material-symbols-outlined text-[#183B68] bg-[#7EC5B3] p-2 rounded-full backdrop-blur-sm">handshake</span>
                </div>
                <h4 className="text-white text-lg font-bold leading-tight">Mentoring Plan</h4>
                <p className="text-slate-200 text-xs line-clamp-2">Set goals and milestones with your mentor.</p>
              </div>
            </div>

            <div className="group relative flex flex-col gap-3 rounded-xl overflow-hidden aspect-[4/3] shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBdzpv4i36XZp_1qruOwkAGRBAKIqXcmlaVPqVT_KNX09AKlGUjeIwcMilfNO1NRe9AzYiu4eho8uDTFNZEjsSSUQNCpm7OeJlvgADEje7AoQmFUELQm7Giy_jH6C4Pn01mE1bAd1lqHJEZ3gd3bC7sGUVBuhYwPgXBhedbGLOq30MRgAE8Ff2VEVstf16o7FgIxbskOhPPQIgXM1VWldiMX8hL6T_f0wV_wKfjA9q142sTbk_4DiJfcFO-8WMtPp-xDuu9DhwJUhM")' }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#183B68]/95 via-[#183B68]/40 to-[#183B68]/10"></div>
              <div className="absolute top-3 right-3 z-10">
                <StatusBadge status={moduleStatuses.interview} onChange={(status) => updateStatus('interview', status)} />
              </div>
              <div className="relative flex flex-col justify-end h-full p-5 gap-1">
                <div className="mb-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="material-symbols-outlined text-[#183B68] bg-[#7EC5B3] p-2 rounded-full backdrop-blur-sm">forum</span>
                </div>
                <h4 className="text-white text-lg font-bold leading-tight">Info Interview Prep</h4>
                <p className="text-slate-200 text-xs line-clamp-2">Prepare questions for industry professionals.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer aspect-[4/3] items-center justify-center group">
              <div className="p-4 bg-slate-200 dark:bg-slate-700 rounded-full group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-400 text-3xl">add</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Discover Modules</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
