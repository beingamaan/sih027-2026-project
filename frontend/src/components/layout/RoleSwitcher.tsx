import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth, RAILWAY_ROLES, RailwayRole } from '../../context/AuthContext';
import { ChevronDown, Check, Shield, Users, HardHat, Award, AlertTriangle, Eye } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { activeRole, currentProfile, setRole, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const navigate = useNavigate();

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const getRoleIcon = (roleId: RailwayRole) => {
    switch (roleId) {
      case 'SECTION_CONTROLLER':
        return <Shield size={14} className="text-blue-600" />;
      case 'DEPT_SUPERVISOR':
        return <Users size={14} className="text-emerald-600" />;
      case 'FIELD_EXEC_LEAD':
        return <HardHat size={14} className="text-amber-600" />;
      case 'DIVISIONAL_OFFICER':
        return <Award size={14} className="text-purple-600" />;
      case 'FIELD_INSPECTOR':
        return <AlertTriangle size={14} className="text-rose-600" />;
      case 'STATION_MASTER':
        return <Eye size={14} className="text-cyan-600" />;
    }
  };

  const handleSelectRole = async (roleKey: RailwayRole) => {
    setIsOpen(false);
    await setRole(roleKey, navigate);
  };

  return (
    <>
      {/* Trigger Button: User Avatar + Name + Active Role Pill */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-white/95 hover:bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-98 cursor-pointer select-none"
        title="Switch Operating Role Profile & JWT Context"
      >
        {/* User Avatar */}
        <div className={`w-8 h-8 rounded-xl ${currentProfile.avatarBg} text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0`}>
          {currentProfile.avatarInitials}
        </div>

        {/* User Info & Role Pill */}
        <div className="text-left hidden sm:block min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-slate-900 truncate max-w-[140px]">
              {currentProfile.name}
            </span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${currentProfile.badgeBg} ${currentProfile.badgeText} ${currentProfile.badgeBorder} uppercase tracking-wider shrink-0`}>
              {currentProfile.roleBadge}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium truncate max-w-[210px]">
            {currentProfile.department}
          </p>
        </div>

        {/* Mobile View Pill */}
        <div className="sm:hidden">
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${currentProfile.badgeBg} ${currentProfile.badgeText} ${currentProfile.badgeBorder}`}>
            {currentProfile.avatarInitials}
          </span>
        </div>

        <ChevronDown 
          size={15} 
          className={`text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Render Portal directly into document.body to completely avoid clipping */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[99999] pointer-events-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Floating Role Menu */}
          <div 
            style={{
              position: 'fixed',
              top: `${dropdownCoords.top}px`,
              right: `${dropdownCoords.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-96 max-h-[85vh] overflow-y-auto bg-white border border-slate-200/95 rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150 text-slate-800"
          >
            <div className="px-2 py-1.5 pb-2.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                Select Operational Role Profile
              </span>
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                JWT Auth & Routing
              </span>
            </div>

            <div className="space-y-1.5 mt-2">
              {(Object.keys(RAILWAY_ROLES) as RailwayRole[]).map((roleKey) => {
                const profile = RAILWAY_ROLES[roleKey];
                const isSelected = activeRole === roleKey;

                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => handleSelectRole(roleKey)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50/90 border border-blue-200 shadow-2xs' 
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${profile.avatarBg} text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0 mt-0.5`}>
                      {profile.avatarInitials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {profile.title}
                        </span>
                        {isSelected && (
                          <span className="text-blue-600 shrink-0">
                            <Check size={14} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-slate-600 mt-0.5 flex items-center gap-1.5">
                        {profile.name}
                        <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          → {profile.landingRoute}
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5 line-clamp-2">
                        {profile.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 px-2 py-1 text-[10px] text-slate-400 font-medium flex items-center justify-between">
              <span>Section 11.1 & 12.3 Blueprint</span>
              <span className="font-mono font-bold text-slate-500">SIH26027</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
