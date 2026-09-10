import React, { useState } from 'react';
import { 
  Calendar, 
  CalendarDays, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Zap, 
  Radio, 
  Sparkles,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export type PlanningHorizon = 'TODAY' | 'WEEKLY' | 'MONTHLY';

interface PlanningHorizonTabsProps {
  activeHorizon: PlanningHorizon;
  onChangeHorizon: (horizon: PlanningHorizon) => void;
  departmentFilter?: 'ALL' | 'ENG' | 'TRD' | 'SNT';
  children?: React.ReactNode;
}

interface WeeklyPossessionDay {
  dayName: string;
  dateStr: string;
  conflictCount: number;
  conflictDetails?: string;
  possessions: {
    code: string;
    section: string;
    window: string;
    duration: string;
    depts: ('ENG' | 'TRD' | 'SNT')[];
    title: string;
    status: 'SANCTIONED' | 'JOINT_VERIFIED' | 'COORDINATING';
  }[];
}

interface MonthlyQuotaItem {
  id: string;
  dept: 'ENG' | 'TRD' | 'SNT';
  category: string;
  sanctionedHours: number;
  quotaHours: number;
  corridorSection: string;
  utilizationPct: number;
  status: 'OPTIMAL' | 'NEAR_CEILING' | 'RESERVE_AVAILABLE';
}

const WEEKLY_SCHEDULE: WeeklyPossessionDay[] = [
  {
    dayName: 'Monday',
    dateStr: '15 Sep 2026',
    conflictCount: 0,
    conflictDetails: 'Harmonized Bundling · 0 Conflicts',
    possessions: [
      {
        code: 'POS-DLI-MON-01',
        section: 'SEC GZB–ANVR (KM 104.2 – 118.0 UP Line)',
        window: '01:30 – 03:45',
        duration: '135m',
        depts: ['ENG', 'TRD'],
        title: 'Joint P-Way Tamper Transit + TRD OHE Power De-energization',
        status: 'SANCTIONED'
      },
      {
        code: 'POS-DLI-MON-02',
        section: 'SEC ANVR Yard Approaching Siding',
        window: '04:00 – 05:15',
        duration: '75m',
        depts: ['SNT'],
        title: 'Point Machine Lubrication & Detection Contact Cleaning',
        status: 'JOINT_VERIFIED'
      }
    ]
  },
  {
    dayName: 'Tuesday',
    dateStr: '16 Sep 2026',
    conflictCount: 1,
    conflictDetails: '1 Minor Conflict · Time Overlap 02:30-03:00 resolved by gang staggering',
    possessions: [
      {
        code: 'POS-DLI-TUE-01',
        section: 'SEC ANVR–ALJN (KM 122.0 – 134.5 DOWN Line)',
        window: '01:45 – 04:15',
        duration: '150m',
        depts: ['ENG', 'TRD', 'SNT'],
        title: 'Tri-Department Joint Corridor Window: Track Alignment + OHE Dropper + Axle Counter',
        status: 'SANCTIONED'
      },
      {
        code: 'POS-DLI-TUE-02',
        section: 'ALJN Yard Siding 02',
        window: '02:30 – 03:45',
        duration: '75m',
        depts: ['ENG'],
        title: 'Switch Expansion Joint (SEJ) Replacement at Turnout Point',
        status: 'COORDINATING'
      }
    ]
  },
  {
    dayName: 'Wednesday',
    dateStr: '17 Sep 2026',
    conflictCount: 0,
    conflictDetails: 'Clean Interlocking Window · 0 Conflicts',
    possessions: [
      {
        code: 'POS-DLI-WED-01',
        section: 'SEC GZB Western Yard Approach',
        window: '02:00 – 03:30',
        duration: '90m',
        depts: ['SNT'],
        title: 'Electronic Interlocking (EI) Micro-processor Redundancy Switchover Test',
        status: 'SANCTIONED'
      }
    ]
  },
  {
    dayName: 'Thursday',
    dateStr: '18 Sep 2026',
    conflictCount: 0,
    conflictDetails: 'Parallel Lane Optimization · 0 Conflicts',
    possessions: [
      {
        code: 'POS-DLI-THU-01',
        section: 'SEC ANVR–ALJN (KM 130.0 – 142.0 UP Line)',
        window: '01:15 – 03:45',
        duration: '150m',
        depts: ['ENG', 'TRD'],
        title: 'OHE Mast Structure Inspection & Rail Weld Ultrasonic Testing (USFD)',
        status: 'SANCTIONED'
      },
      {
        code: 'POS-DLI-THU-02',
        section: 'ALJN Goods Yard Loop',
        window: '03:45 – 05:00',
        duration: '75m',
        depts: ['TRD'],
        title: 'Catenary Wire Tensioner Weight Adjustment',
        status: 'JOINT_VERIFIED'
      }
    ]
  },
  {
    dayName: 'Friday',
    dateStr: '19 Sep 2026',
    conflictCount: 2,
    conflictDetails: '2 Inter-Department Conflicts · Resolved via sequential handback',
    possessions: [
      {
        code: 'POS-DLI-FRI-01',
        section: 'SEC GZB–ANVR (KM 100.0 – 120.0 Double Main)',
        window: '01:00 – 04:00',
        duration: '180m',
        depts: ['ENG', 'TRD', 'SNT'],
        title: 'Pre-Weekend Corridor Fortification: Rail Grinding Train + OHE Inspection + Signal Testing',
        status: 'SANCTIONED'
      },
      {
        code: 'POS-DLI-FRI-02',
        section: 'SEC ALJN–TDL (Single Line Gateway KM 140–148)',
        window: '02:15 – 04:15',
        duration: '120m',
        depts: ['ENG', 'SNT'],
        title: 'Track Circuit Bond Wire Replacement & Joint Sleepers Packing',
        status: 'COORDINATING'
      }
    ]
  },
  {
    dayName: 'Saturday',
    dateStr: '20 Sep 2026',
    conflictCount: 0,
    conflictDetails: 'Dedicated Structural Window · 0 Conflicts',
    possessions: [
      {
        code: 'POS-DLI-SAT-01',
        section: 'Bridge No. 42 over Betwa Canal (KM 131.2)',
        window: '02:00 – 04:00',
        duration: '120m',
        depts: ['ENG'],
        title: 'Steel Girder Truss Inspection & Guard Rail Fastener Replacement',
        status: 'SANCTIONED'
      }
    ]
  },
  {
    dayName: 'Sunday',
    dateStr: '21 Sep 2026',
    conflictCount: 0,
    conflictDetails: 'Unified Divisional Mega-Block Sanctioned · 0 Conflicts',
    possessions: [
      {
        code: 'POS-DLI-SUN-01',
        section: 'Corridor-Wide (GZB to TDL KM 100–158)',
        window: '01:00 – 05:00',
        duration: '240m',
        depts: ['ENG', 'TRD', 'SNT'],
        title: 'Sunday Mega-Block: Integrated Track Machine Tamper, OHE Power Block & EI Testing',
        status: 'SANCTIONED'
      }
    ]
  }
];

const MONTHLY_QUOTAS: MonthlyQuotaItem[] = [
  {
    id: 'Q-ENG-01',
    dept: 'ENG',
    category: 'P.Way Track Tamping',
    sanctionedHours: 42,
    quotaHours: 50,
    corridorSection: 'GZB – TDL Main Line (KM 100.0 – 158.0)',
    utilizationPct: 84,
    status: 'OPTIMAL'
  },
  {
    id: 'Q-TRD-01',
    dept: 'TRD',
    category: 'TRD OHE Power Blocks',
    sanctionedHours: 31,
    quotaHours: 36,
    corridorSection: '25kV Traction Line & Neutral Sections',
    utilizationPct: 86,
    status: 'OPTIMAL'
  },
  {
    id: 'Q-SNT-01',
    dept: 'SNT',
    category: 'S&T Electronic Interlocking & Cables',
    sanctionedHours: 18,
    quotaHours: 24,
    corridorSection: 'GZB, ANVR, ALJN EI Stations & Signal Relays',
    utilizationPct: 75,
    status: 'OPTIMAL'
  },
  {
    id: 'Q-ENG-02',
    dept: 'ENG',
    category: 'Deep Ballast Cleaning (BCM Machine)',
    sanctionedHours: 12,
    quotaHours: 20,
    corridorSection: 'SEC ANVR–ALJN Ballast Cushion Restoration',
    utilizationPct: 60,
    status: 'RESERVE_AVAILABLE'
  },
  {
    id: 'Q-ENG-03',
    dept: 'ENG',
    category: 'Bridge & Structural Overhaul',
    sanctionedHours: 8,
    quotaHours: 12,
    corridorSection: 'Bridge No. 42 (KM 131.2) & Minor Culverts',
    utilizationPct: 66,
    status: 'RESERVE_AVAILABLE'
  }
];

export const PlanningHorizonTabs: React.FC<PlanningHorizonTabsProps> = ({
  activeHorizon,
  onChangeHorizon,
  departmentFilter = 'ALL',
  children
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  const activeDayData = WEEKLY_SCHEDULE.find(d => d.dayName === selectedDay) || WEEKLY_SCHEDULE[0];

  const filteredQuotas = departmentFilter === 'ALL' 
    ? MONTHLY_QUOTAS 
    : MONTHLY_QUOTAS.filter(q => q.dept === departmentFilter);

  const totalSanctioned = MONTHLY_QUOTAS.reduce((acc, q) => acc + q.sanctionedHours, 0);
  const totalQuota = MONTHLY_QUOTAS.reduce((acc, q) => acc + q.quotaHours, 0);
  const totalPercentage = Math.round((totalSanctioned / totalQuota) * 100);

  return (
    <div className="space-y-4">
      {/* Horizon Switch Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => onChangeHorizon('TODAY')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeHorizon === 'TODAY'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock size={14} className={activeHorizon === 'TODAY' ? 'text-blue-600' : 'text-slate-400'} />
            Today (Live 24h)
          </button>

          <button
            type="button"
            onClick={() => onChangeHorizon('WEEKLY')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeHorizon === 'WEEKLY'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays size={14} className={activeHorizon === 'WEEKLY' ? 'text-amber-600' : 'text-slate-400'} />
            Weekly Rolling (7-Day)
          </button>

          <button
            type="button"
            onClick={() => onChangeHorizon('MONTHLY')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeHorizon === 'MONTHLY'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 size={14} className={activeHorizon === 'MONTHLY' ? 'text-purple-600' : 'text-slate-400'} />
            Monthly Master (30-Day Corridor Plan)
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 px-3">
          {activeHorizon === 'TODAY' && (
            <span className="flex items-center gap-1.5 text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Live Tactical Window Active
            </span>
          )}
          {activeHorizon === 'WEEKLY' && (
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              7-Day Rolling Coordination Matrix
            </span>
          )}
          {activeHorizon === 'MONTHLY' && (
            <span className="flex items-center gap-1.5 text-purple-700">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              Mega-Block Quota Governance
            </span>
          )}
        </div>
      </div>

      {/* HORIZON 1: TODAY (Live 24h) */}
      {activeHorizon === 'TODAY' && children}

      {/* HORIZON 2: WEEKLY ROLLING (7-DAY VIEW) */}
      {activeHorizon === 'WEEKLY' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Day Segment Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {WEEKLY_SCHEDULE.map((day) => {
              const isSelected = selectedDay === day.dayName;
              return (
                <button
                  key={day.dayName}
                  type="button"
                  onClick={() => setSelectedDay(day.dayName)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-blue-600 ring-2 ring-blue-600/20 shadow-sm'
                      : 'bg-white/80 hover:bg-white border-slate-200/80 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{day.dayName}</span>
                    {day.conflictCount === 0 ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="0 Conflicts"></span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-500" title={`${day.conflictCount} Conflict`}></span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">{day.dateStr}</span>
                  <div className="mt-2 text-[10px] font-bold text-slate-700 flex items-center justify-between">
                    <span>{day.possessions.length} Blocks</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                      day.conflictCount === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {day.conflictCount} conf.
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Day Possessions Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">
                    {activeDayData.dayName} Corridor Possessions ({activeDayData.dateStr})
                  </h3>
                  <span className="text-xs font-bold text-slate-500">
                    • {activeDayData.possessions.length} Scheduled Blocks
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inter-department possession synchronization across Northern Railway Delhi Division.
                </p>
              </div>

              {/* Conflict Badge */}
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 self-start sm:self-auto ${
                activeDayData.conflictCount === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {activeDayData.conflictCount === 0 ? (
                  <CheckCircle2 size={14} className="text-emerald-600" />
                ) : (
                  <AlertTriangle size={14} className="text-amber-600" />
                )}
                <span>{activeDayData.conflictDetails}</span>
              </div>
            </div>

            {/* Possessions List */}
            <div className="space-y-3">
              {activeDayData.possessions.map((pos) => (
                <div 
                  key={pos.code} 
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {pos.code}
                      </span>
                      <span className="text-xs font-black text-slate-900">{pos.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                      <span className="font-semibold text-slate-700">{pos.section}</span>
                      <span>•</span>
                      <span className="font-mono font-bold text-slate-800">Window: {pos.window} ({pos.duration})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
                    {/* Dept badges */}
                    <div className="flex items-center gap-1">
                      {pos.depts.map(dept => (
                        <span 
                          key={dept}
                          className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            dept === 'ENG' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            dept === 'TRD' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                            'bg-teal-100 text-teal-900 border border-teal-300'
                          }`}
                        >
                          {dept}
                        </span>
                      ))}
                    </div>

                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black tracking-wide bg-emerald-100 text-emerald-900 border border-emerald-200">
                      {pos.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HORIZON 3: MONTHLY MASTER (30-DAY QUOTA PLAN) */}
      {activeHorizon === 'MONTHLY' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Executive Quota Header Banner */}
          <div className="bg-gradient-to-r from-[#102A43] to-[#1E3A8A] text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                  Divisional Operating Quota
                </span>
                <span className="text-xs text-blue-200 font-semibold">• Northern Railway Delhi Division</span>
              </div>
              <h3 className="text-xl font-black">Monthly Mega-Block Quota Sanction &amp; Capacity Ledger</h3>
              <p className="text-xs text-blue-200 mt-1 max-w-2xl">
                Monitors departmental quota utilization against monthly corridor line-capacity ceilings. Pre-empts track congestion while guaranteeing safety-critical maintenance allowances.
              </p>
            </div>

            {/* Total Utilization Chip */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-right shrink-0">
              <div className="text-2xl font-black font-mono">{totalSanctioned} / {totalQuota} hrs</div>
              <div className="text-xs text-blue-200 font-semibold mt-0.5">
                {totalPercentage}% Total Corridor Quota Sanctioned
              </div>
            </div>
          </div>

          {/* Quota Utilization Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuotas.map((item) => {
              const remaining = item.quotaHours - item.sanctionedHours;
              return (
                <div 
                  key={item.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5 hover:shadow-xs transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          item.dept === 'ENG' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                          item.dept === 'TRD' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                          'bg-teal-100 text-teal-900 border border-teal-200'
                        }`}>
                          {item.dept}
                        </span>
                        <h4 className="text-sm font-black text-slate-900">{item.category}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.corridorSection}</p>
                    </div>

                    <span className="text-xs font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {item.sanctionedHours} hrs / {item.quotaHours} hrs
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Quota Sanctioned: {item.utilizationPct}%</span>
                      <span className="text-emerald-700 font-bold">{remaining} hrs available</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          item.utilizationPct >= 85 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${item.utilizationPct}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-slate-700 font-semibold">
                      <ShieldCheck size={13} className="text-emerald-600" />
                      Statutory G&amp;SR Clearance Active
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      ID: {item.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningHorizonTabs;
