/* eslint-disable i18next/no-literal-string */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Select } from 'react-daisyui';

export interface CascadingOption {
  value: string;
  label: string;
  children?: CascadingOption[];
}

interface CascadingSelectProps {
  name: string;
  label: string;
  options: CascadingOption[];
  values?: string[]; // Array of selected values for each level
  onChange: (values: string[]) => void;
  placeholder?: string[];
  disabled?: boolean;
  className?: string;
  error?: string;
  required?: boolean;
  maxLevels?: number;
}

const CascadingSelect: React.FC<CascadingSelectProps> = ({
  name,
  label,
  options,
  values = [],
  onChange,
  placeholder = ['Select...'],
  disabled = false,
  className = '',
  error,
  required = false,
  maxLevels = 3,
}) => {
  const [localValues, setLocalValues] = useState<string[]>(values);
  const [availableOptions, setAvailableOptions] = useState<CascadingOption[][]>(
    [options]
  );

  useEffect(() => {
    setLocalValues(values);
    update_available_options(values);
  }, [values, options]);

  const update_available_options = (current_values: string[]) => {
    const new_available_options: CascadingOption[][] = [options];

    let current_options = options;
    for (
      let level = 0;
      level < current_values.length && level < maxLevels - 1;
      level++
    ) {
      const selected_value = current_values[level];
      const selected_option = current_options.find(
        (opt) => opt.value === selected_value
      );

      if (selected_option && selected_option.children) {
        new_available_options.push(selected_option.children);
        current_options = selected_option.children;
      } else {
        break;
      }
    }

    setAvailableOptions(new_available_options);
  };

  const handle_select_change = (level: number, selected_value: string) => {
    const new_values = [...localValues];

    // Update the value at the current level
    new_values[level] = selected_value;

    // Clear all values after the current level
    new_values.splice(level + 1);

    setLocalValues(new_values);
    update_available_options(new_values);
    onChange(new_values);
  };

  const get_placeholder_for_level = (level: number): string => {
    if (placeholder.length > level) {
      return placeholder[level];
    }
    return placeholder[0] || 'Select...';
  };

  const is_level_disabled = (level: number): boolean => {
    if (disabled) return true;
    if (level === 0) return false;

    // Disable if previous level hasn't been selected
    return !localValues[level - 1];
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Cascading select levels */}
      <div className="space-y-2">
        {availableOptions.map((options_for_level, level) => (
          <div key={level} className="flex flex-col">
            {level > 0 && (
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Level {level + 1}
              </label>
            )}
            <Select
              name={`${name}_level_${level}`}
              value={localValues[level] || ''}
              onChange={(e) => handle_select_change(level, e.target.value)}
              disabled={is_level_disabled(level)}
              className={`
                w-full text-sm
                ${error ? 'border-red-500 focus:border-red-500' : ''}
                ${is_level_disabled(level) ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <option value="" disabled>
                {get_placeholder_for_level(level)}
              </option>
              {options_for_level.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        ))}
      </div>

      {/* Selected path display */}
      {localValues.length > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">Selected: </span>
          {localValues.map((value, index) => {
            const level_options = availableOptions[index] || [];
            const option = level_options.find((opt) => opt.value === value);
            return option ? (
              <span key={index}>
                {index > 0 && ' → '}
                <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md">
                  {option.label}
                </span>
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-xs text-red-600 dark:text-red-400">{error}</div>
      )}
    </div>
  );
};

export default CascadingSelect;
