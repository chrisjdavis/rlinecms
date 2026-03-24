import * as React from "react";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, id, className, ...props }) => {
  return (
    <label className={`inline-flex items-center cursor-pointer ${className || ""}`} htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onCheckedChange(e.target.checked)}
        className="sr-only peer"
        {...props}
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:bg-black transition-colors duration-200 relative">
        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`}></div>
      </div>
    </label>
  );
}; 