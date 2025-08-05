/* eslint-disable i18next/no-literal-string */
import React from 'react';

interface RadioOption {
  value: string | number;
  label: string;
  description?: string;
}

interface RadioButtonGroupProps {
  name: string;
  label: string;
  options: RadioOption[];
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  required?: boolean;
  error?: string;
  className?: string;
}

const RadioButtonGroup: React.FC<RadioButtonGroupProps> = ({
  name,
  label,
  options,
  value,
  onChange,
  required = false,
  error,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            htmlFor={`${name}-${option.value}`}
            className={`
              flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200
              ${
                value === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }
            `}
          >
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-700"
            />
            <div className="ml-3 flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {option.label}
              </div>
              {option.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                  {option.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
      
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </div>
  );
};

export default RadioButtonGroup;