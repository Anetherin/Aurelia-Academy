
import React, { useState } from 'react';
import { Cloud, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { GameSettings } from '../types';

interface Props {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onSync: () => Promise<void>;
  onComplete: () => void;
  isLoading: boolean;
}

const DropboxConnect: React.FC<Props> = ({ settings, onUpdateSettings, onSync, onComplete, isLoading }) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSync = async () => {
    setError(null);
    try {
      await onSync();
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Connection failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="flex justify-center mb-8">
          <div className="p-5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
            <Cloud size={48} className="text-indigo-400 animate-pulse" />
          </div>
        </div>

        <h1 className="text-3xl font-serif font-bold text-center text-white mb-2">Cloud Integration</h1>
        <p className="text-slate-400 text-center text-sm mb-10 leading-relaxed">
          Connect your Dropbox archive to sync high-fidelity student assets and club media.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Access Token</label>
            <input 
              type="password"
              placeholder="dbx-xxxxxxxxxxxx"
              value={settings.dropboxToken}
              onChange={(e) => onUpdateSettings({ ...settings, dropboxToken: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-sm outline-none focus:border-indigo-500 transition-all text-indigo-300 font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Root Folder Path</label>
            <input 
              type="text"
              placeholder="/Aurelia Assets"
              value={settings.assetBaseUrl}
              onChange={(e) => onUpdateSettings({ ...settings, assetBaseUrl: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-sm outline-none focus:border-indigo-500 transition-all text-slate-300"
            />
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs italic">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs italic">
              <CheckCircle2 size={14} /> Connection established. Archives mapped.
            </div>
          )}

          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={handleSync}
              disabled={isLoading || !settings.dropboxToken}
              className="w-full py-5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-700 rounded-3xl text-sm font-bold transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Verify Connection"}
            </button>
            
            <button 
              onClick={onComplete}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 rounded-3xl text-sm font-bold transition-all shadow-xl shadow-indigo-500/10 flex items-center justify-center gap-2 group"
            >
              Proceed to Academy Setup <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <p className="text-[10px] text-slate-600 text-center italic mt-4">
            You can skip this step and use procedural assets.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DropboxConnect;
