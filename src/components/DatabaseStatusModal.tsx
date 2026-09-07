import React, { useState } from 'react';
import {
  Database,
  X,
  RefreshCw,
  Server,
  Network,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Laptop
} from 'lucide-react';
import { DbStatusResponse, reconnectDbApi, syncQuotationsApi } from '../utils/apiClient';
import { getSavedQuotations } from '../utils/quotationStorage';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: DbStatusResponse | null;
  onRefreshStatus: () => void;
  quotationCount: number;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
  dbStatus,
  onRefreshStatus,
  quotationCount,
}) => {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isMongo = dbStatus?.engine === 'mongodb';

  const handleReconnect = async () => {
    setIsReconnecting(true);
    setSyncMessage(null);
    try {
      await reconnectDbApi();
      onRefreshStatus();
      setSyncMessage('Database connection refreshed successfully.');
    } catch {
      setSyncMessage('Failed to reconnect to database.');
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const localQuotes = getSavedQuotations();
      const res = await syncQuotationsApi(localQuotes);
      if (res) {
        setSyncMessage(`Synchronized ${res.total} quotations to centralized database.`);
        onRefreshStatus();
      }
    } catch {
      setSyncMessage('Error syncing with centralized database.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyHostUrl = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isMongo ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>Centralized Intranet Database</span>
                <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                  isMongo ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {isMongo ? 'MongoDB Active' : 'Intranet Storage'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Shared live across all PCs and users on the same intranet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Alert */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            isMongo
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-blue-50/70 border-blue-200 text-blue-950'
          }`}>
            <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              isMongo ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {isMongo ? <CheckCircle2 className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
            </div>
            <div className="text-xs space-y-1">
              <div className="font-bold text-sm">
                {isMongo
                  ? 'Connected to MongoDB (Compass Ready)'
                  : 'Centralized Server Storage Active'}
              </div>
              <p className="leading-relaxed opacity-90">
                {dbStatus?.message || 'Database service running and accepting requests.'}
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2 font-mono text-[11px]">
                <span className="bg-white/80 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                  Database: <span className="text-slate-900">{dbStatus?.databaseName || 'interglass'}</span>
                </span>
                <span className="bg-white/80 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                  Records: <span className="text-slate-900">{quotationCount} quotations</span>
                </span>
              </div>
            </div>
          </div>

          {/* Intranet Access Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                <Network className="w-4 h-4 text-[#7B1818]" />
                <span>Intranet Access Address (For Other PCs)</span>
              </div>
              <button
                type="button"
                onClick={handleCopyHostUrl}
                className="text-xs flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Any PC connected to this office network can open this portal by typing the host address in Chrome or Edge:
            </p>
            <div className="bg-white border border-slate-300 rounded-lg p-2.5 font-mono text-xs text-slate-900 flex items-center justify-between">
              <span>{window.location.origin}</span>
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                Live & Connected
              </span>
            </div>
          </div>

          {/* MongoDB Compass Guide */}
          <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wider">
              <Server className="w-4 h-4 text-emerald-700" />
              <span>How to view data in MongoDB Compass</span>
            </div>
            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                Open <strong>MongoDB Compass</strong> on your PC (as shown in your screenshot).
              </li>
              <li>
                In the connection list, click on <strong>localhost:27017</strong> and click <strong>Connect</strong>.
              </li>
              <li>
                You will see the database named <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-bold text-emerald-900">interglass</code>.
              </li>
              <li>
                Click on the <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-bold text-emerald-900">quotations</code> collection to view every quotation, customer, and job card created by any user!
              </li>
              <li>
                The <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-bold text-emerald-900">counters</code> collection guarantees consecutive numbering without duplicate numbers.
              </li>
            </ol>
          </div>

          {/* Sync Message Feedback */}
          {syncMessage && (
            <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isReconnecting}
              onClick={handleReconnect}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 disabled:opacity-60 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isReconnecting ? 'Checking...' : 'Check / Reconnect DB'}</span>
            </button>

            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSyncAll}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 disabled:opacity-60 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Ensure all local quotations are stored in the server database"
            >
              <HardDrive className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce text-emerald-600' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Force Sync to Server DB'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
