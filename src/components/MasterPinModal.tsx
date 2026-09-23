import React, { useState } from 'react';
import { X, Lock, AlertCircle } from 'lucide-react';
import { hasMasterPin, setMasterPin, verifyMasterPin } from '../services/storageService';

interface MasterPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
}

export const MasterPinModal: React.FC<MasterPinModalProps> = ({ isOpen, onClose, onUnlockSuccess }) => {
  const isPinCreated = hasMasterPin();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    if (!isPinCreated) {
      // Create new PIN
      setMasterPin(pinInput);
      onUnlockSuccess();
      onClose();
    } else {
      // Verify existing PIN
      if (verifyMasterPin(pinInput)) {
        onUnlockSuccess();
        onClose();
        setErrorMsg(null);
      } else {
        setErrorMsg('Invalid Security PIN. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-indigo-500/40 shadow-2xl space-y-4 text-center">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">
            {isPinCreated ? 'Enter Master Security PIN' : 'Create Master Security PIN'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isPinCreated
              ? 'Enter your PIN to reveal protected client credentials on screen.'
              : 'Set a Master PIN to protect passwords from unauthorized viewing.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            maxLength={8}
            placeholder="Enter PIN (e.g. 1234)"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            autoFocus
            className="w-full text-center text-lg tracking-widest font-mono p-3 rounded-xl glass-input"
          />

          <button
            type="submit"
            className="w-full py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/25"
          >
            {isPinCreated ? 'Unlock Vault' : 'Set & Unlock PIN'}
          </button>
        </form>
      </div>
    </div>
  );
};
