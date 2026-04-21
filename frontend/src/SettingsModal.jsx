import React, { useState } from 'react';

export default function SettingsModal({ isOpen, onClose, onLogout, onDeleteAccount, theme }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className={`p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 transition-colors ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`} onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6">Profile Settings</h2>
        
        <div className="space-y-4">
          <button onClick={onLogout} className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors font-medium">
            Logout
          </button>

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors font-medium">
              Delete Account
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-500 font-medium mb-4">Are you sure you want to delete your account? This action is irreversible.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">Cancel</button>
                <button onClick={onDeleteAccount} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">Confirm Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}