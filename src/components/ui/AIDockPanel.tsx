import React from "react";

interface AIDockPanelProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  onApply: () => void;
  applyDisabled: boolean;
  isApplying: boolean;
  applyError?: string;
}

export function AIDockPanel({ open, onClose, children, onApply, applyDisabled, isApplying, applyError }: AIDockPanelProps) {
  if (!open) return null;
  return (
    <div className="fixed bottom-5 right-[30px] w-[600px] max-w-full rounded-t-2xl border-t border-x border-b-0 shadow-2xl bg-white z-50 animate-in slide-in-from-bottom-10 duration-300">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b">
        <span className="font-semibold text-lg">AI Recommendations</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none">&times;</button>
      </div>
      <div className="p-6 text-sm whitespace-pre-line max-h-[40vh] overflow-y-auto">
        {children}
      </div>
      <div id="footer" className="flex flex-col items-end px-2 pt-2 pb-2 border-t gap-1">
        <button
          onClick={onApply}
          disabled={applyDisabled || isApplying}
          className="bg-primary text-sm text-white px-4 py-2 rounded hover:opacity-80 disabled:opacity-50 flex items-center gap-2"
        >
          {isApplying ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              Applying...
            </>
          ) : (
            "Apply Suggestions"
          )}
        </button>
        {applyError && <div className="text-red-500 text-xs mt-1">{applyError}</div>}
      </div>
    </div>
  );
} 