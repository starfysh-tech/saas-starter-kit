/* eslint-disable i18next/no-literal-string */
import React, { useState } from 'react';
import { Checkbox } from 'react-daisyui';

export type SeverityLevel = 'mild' | 'moderate' | 'severe' | 'very_severe';

interface CheckboxWithSeverityProps {
  name: string;
  label: string;
  checked?: boolean;
  severity?: SeverityLevel;
  onChange: (checked: boolean, severity?: SeverityLevel) => void;
  disabled?: boolean;
  className?: string;
  error?: string;
  required?: boolean;
}

const SEVERITY_LEVELS: {
  value: SeverityLevel;
  label: string;
  colorClass: string;
}[] = [
  {
    value: 'mild',
    label: 'Mild',
    colorClass: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    colorClass: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  {
    value: 'severe',
    label: 'Severe',
    colorClass: 'text-red-600 bg-red-50 border-red-200',
  },
  {
    value: 'very_severe',
    label: 'Very Severe',
    colorClass: 'text-red-800 bg-red-100 border-red-300',
  },
];

const CheckboxWithSeverity: React.FC<CheckboxWithSeverityProps> = ({
  name,
  label,
  checked = false,
  severity,
  onChange,
  disabled = false,
  className = '',
  error,
  required = false,
}) => {
  const [localChecked, setLocalChecked] = useState(checked);
  const [localSeverity, setLocalSeverity] = useState<SeverityLevel | undefined>(
    severity
  );

  const handle_checkbox_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const new_checked = e.target.checked;
    setLocalChecked(new_checked);

    if (!new_checked) {
      // If unchecked, clear severity
      setLocalSeverity(undefined);
      onChange(false, undefined);
    } else {
      // If checked and no severity selected, default to mild
      const new_severity = localSeverity || 'mild';
      setLocalSeverity(new_severity);
      onChange(true, new_severity);
    }
  };

  const handle_severity_change = (new_severity: SeverityLevel) => {
    setLocalSeverity(new_severity);
    onChange(localChecked, new_severity);
  };

  const get_severity_info = (level: SeverityLevel) => {
    return SEVERITY_LEVELS.find((s) => s.value === level);
  };

  return (
    <div className={`${className}`}>
      {/* Single row layout */}
      <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        {/* Left side: Checkbox + Label */}
        <label className="flex items-center gap-3 text-sm cursor-pointer flex-1">
          <Checkbox
            name={name}
            checked={localChecked}
            onChange={handle_checkbox_change}
            disabled={disabled}
            className="h-5 w-5 rounded [--chkfg:oklch(var(--p))] [--chkbg:white]"
          />
          <span
            className={`font-medium text-gray-900 dark:text-gray-100 ${required ? 'after:content-["*"] after:text-red-500 after:ml-1' : ''}`}
          >
            {label}
          </span>
        </label>

        {/* Right side: Severity buttons - only shown when checked */}
        {localChecked && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Severity:
            </span>
            <div className="flex gap-1">
              {SEVERITY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => handle_severity_change(level.value)}
                  disabled={disabled}
                  className={`
                    px-2 py-1 text-xs font-medium rounded border transition-all duration-200
                    ${
                      localSeverity === level.value
                        ? level.colorClass
                        : 'text-gray-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default CheckboxWithSeverity;
