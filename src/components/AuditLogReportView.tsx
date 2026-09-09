import React from 'react';
import {
  History,
  User,
  Clock,
  Calendar,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  GitBranch,
  Ban,
  Tag
} from 'lucide-react';
import { ActivityLog, UserAccount } from '../types';
import { InterglassEmblem } from './InterglassLogo';

interface AuditLogReportViewProps {
  logs: ActivityLog[];
  currentUser?: UserAccount | null;
  filters: {
    search: string;
    user: string;
    action: string;
    dateFrom: string;
    dateTo: string;
  };
}

/**
 * Helper to render appropriate action badge and styling
 */
function getActionBadge(action: string) {
  switch (action) {
    case 'CREATE_QUOTE':
      return {
        label: 'NEW QUOTE',
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
        dotClass: 'bg-blue-600',
      };
    case 'EDIT_QUOTE':
      return {
        label: 'QUOTE EDITED',
        badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
        dotClass: 'bg-indigo-600',
      };
    case 'CONFIRM_JOB':
      return {
        label: 'JOB CONFIRMED',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
        dotClass: 'bg-emerald-600',
      };
    case 'UNCONFIRM_JOB':
      return {
        label: 'JOB UNLOCKED',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        dotClass: 'bg-amber-600',
      };
    case 'UPDATE_COMMENT':
      return {
        label: 'COMMENT ENTERED',
        badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300 font-semibold',
        dotClass: 'bg-yellow-600',
      };
    case 'UPDATE_REMARKS':
      return {
        label: 'COORDINATOR REMARK',
        badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
        dotClass: 'bg-teal-600',
      };
    case 'UPDATE_SALESMAN':
      return {
        label: 'SALESMAN ASSIGNED',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
        dotClass: 'bg-purple-600',
      };
    case 'UPDATE_INVOICE':
      return {
        label: 'STATUS / INVOICE',
        badgeClass: 'bg-green-100 text-green-900 border-green-300',
        dotClass: 'bg-green-600',
      };
    case 'CANCEL_QUOTE':
      return {
        label: 'QUOTE CANCELLED',
        badgeClass: 'bg-red-100 text-red-950 border-red-300 font-bold',
        dotClass: 'bg-red-600',
      };
    case 'UNCANCEL_QUOTE':
      return {
        label: 'QUOTE RESTORED',
        badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300',
        dotClass: 'bg-cyan-600',
      };
    case 'REVISE_QUOTE':
      return {
        label: 'NEW REVISION',
        badgeClass: 'bg-violet-100 text-violet-900 border-violet-300',
        dotClass: 'bg-violet-600',
      };
    case 'DUPLICATE_QUOTE':
      return {
        label: 'DUPLICATED',
        badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
        dotClass: 'bg-sky-600',
      };
    default:
      return {
        label: action.replace(/_/g, ' '),
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
        dotClass: 'bg-slate-500',
      };
  }
}

export const AuditLogReportView: React.FC<AuditLogReportViewProps> = ({
  logs,
  currentUser,
  filters
}) => {
  // Compute analytics from logs
  const totalEvents = logs.length;
  const uniqueUsers = new Set(logs.map((l) => l.user)).size;
  const uniqueReferences = new Set(logs.map((l) => l.reference)).size;
  const commentCount = logs.filter(
    (l) => l.action === 'UPDATE_COMMENT' || l.action === 'UPDATE_REMARKS'
  ).length;

  const nowFormatted = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-6">
      {/* 1. Official Interglass Report Header */}
      <div className="border-b-2 border-[#7B1818] pb-4 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#7B1818] to-[#991b1b] flex items-center justify-center p-2.5 shadow-md">
            <InterglassEmblem className="w-full h-full text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-serif">
              INTERNATIONAL GLASS CO LLC
            </h1>
            <p className="text-xs font-semibold text-slate-600 tracking-wide">
              Architectural Glass Processing • Tempering • Double Glazing • Laminating
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-mono font-bold bg-[#7B1818] text-white px-2 py-0.5 rounded">
                MANAGEMENT AUDIT REPORT
              </span>
              <span className="text-xs text-slate-500 font-medium">
                System Change Log & Audit Trail Record
              </span>
            </div>
          </div>
        </div>

        {/* Report Metadata Block */}
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs space-y-1 min-w-[240px]">
          <div className="flex items-center justify-between gap-3 text-slate-600">
            <span className="font-semibold text-slate-700">Report Type:</span>
            <span className="font-mono font-bold text-[#7B1818]">SYSTEM AUDIT LOG</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-slate-600">
            <span className="font-semibold text-slate-700">Generated On:</span>
            <span className="font-mono">{nowFormatted}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-slate-600">
            <span className="font-semibold text-slate-700">Generated By:</span>
            <span className="font-bold text-slate-900">{currentUser?.username || 'ADMIN'} ({currentUser?.role || 'ADMIN'})</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-slate-600">
            <span className="font-semibold text-slate-700">Total Entries:</span>
            <span className="font-mono font-bold text-emerald-700">{totalEvents} Records</span>
          </div>
        </div>
      </div>

      {/* 2. Filter Summary / Active Scope Banner */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-lg px-4 py-2 text-xs flex items-center justify-between flex-wrap gap-2 text-amber-900">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold">Active Scope:</span>
          <span>
            User:{' '}
            <strong className="text-amber-950">
              {filters.user === 'all' ? 'All System Users' : filters.user}
            </strong>
          </span>
          <span className="text-amber-300">•</span>
          <span>
            Action:{' '}
            <strong className="text-amber-950">
              {filters.action === 'all' ? 'All Activities' : filters.action.replace(/_/g, ' ')}
            </strong>
          </span>
          <span className="text-amber-300">•</span>
          <span>
            Date Span:{' '}
            <strong className="text-amber-950">
              {filters.dateFrom || filters.dateTo
                ? `${filters.dateFrom || 'Any'} to ${filters.dateTo || 'Today'}`
                : 'All Historical Records'}
            </strong>
          </span>
          {filters.search && (
            <>
              <span className="text-amber-300">•</span>
              <span>
                Search: <strong className="text-amber-950 font-mono">"{filters.search}"</strong>
              </span>
            </>
          )}
        </div>
        <div className="font-mono font-bold text-amber-800">
          Showing {logs.length} of {logs.length} change entries
        </div>
      </div>

      {/* 3. Executive KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Changes</span>
            <History className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalEvents.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Logged actions recorded</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Users Active</span>
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900 font-mono">
            {uniqueUsers}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Operators & managers</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Quotes / Jobs</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono">
            {uniqueReferences}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Distinct references</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Comments Logged</span>
            <MessageSquare className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">
            {commentCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Factory & coordinator notes</p>
        </div>
      </div>

      {/* 4. Complete Audit Log Table */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
        <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-xs uppercase tracking-wider">
              Chronological Audit Trail & System Events
            </span>
          </div>
          <span className="text-xs text-slate-300 font-mono">
            Chronological Order (Newest First)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200">#</th>
                <th className="py-2.5 px-3 w-32 border-r border-slate-200">Date & Time</th>
                <th className="py-2.5 px-3 w-36 border-r border-slate-200">User / Operator</th>
                <th className="py-2.5 px-3 w-40 border-r border-slate-200">Action Performed</th>
                <th className="py-2.5 px-3 w-40 border-r border-slate-200">Quote / Job Ref</th>
                <th className="py-2.5 px-3 w-48 border-r border-slate-200">Client</th>
                <th className="py-2.5 px-4 min-w-[280px]">Audit Details & Modifications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <History className="w-8 h-8 text-slate-300" />
                      <p className="font-bold text-sm text-slate-600">No activity log entries found</p>
                      <p className="text-xs text-slate-400">
                        Adjust your search filters or date selection to view audit records.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* S.No */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500 border-r border-slate-200">
                        {index + 1}
                      </td>

                      {/* Date & Time */}
                      <td className="py-2.5 px-3 font-mono border-r border-slate-200 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-[11px]">{log.date}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                          <span>{log.time}</span>
                        </div>
                      </td>

                      {/* User & Role */}
                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {log.user.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{log.user}</div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {log.userRole || 'ADMIN'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action Performed */}
                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] tracking-wide ${badge.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`}></span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Quote / Job Ref */}
                      <td className="py-2.5 px-3 font-mono border-r border-slate-200">
                        <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 text-[11px] inline-block">
                          {log.reference}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <div className="font-bold text-slate-800 truncate max-w-[190px]" title={log.clientName || 'General'}>
                          {log.clientName || <span className="text-slate-400 italic">N/A</span>}
                        </div>
                      </td>

                      {/* Audit Details */}
                      <td className="py-2.5 px-4 text-slate-800">
                        <div className="font-bold text-slate-900">{log.summary}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-sans">
                          {log.details}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Executive Sign-Off & Verification Footer for PDF / Presentation */}
      <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
        <div className="border-t border-slate-400 pt-2">
          <p className="font-bold text-slate-800">IT Systems Administrator</p>
          <p className="text-slate-500 mt-0.5">Audit Trail Verification</p>
        </div>
        <div className="border-t border-slate-400 pt-2">
          <p className="font-bold text-slate-800">Operations & Plant Director</p>
          <p className="text-slate-500 mt-0.5">Operational Review</p>
        </div>
        <div className="border-t border-slate-400 pt-2">
          <p className="font-bold text-slate-800">Managing Director / General Manager</p>
          <p className="text-slate-500 mt-0.5">Executive Management Sign-Off</p>
        </div>
      </div>
    </div>
  );
};
