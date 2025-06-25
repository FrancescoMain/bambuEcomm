import React from "react";

interface CheckoutInputProps {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  readOnly?: boolean;
  pattern?: string;
  className?: string;
  icon?: React.ReactNode;
}

export const CheckoutInput: React.FC<CheckoutInputProps> = ({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  readOnly = false,
  pattern,
  className = "",
  icon,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const hasValue = value && value.length > 0;

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          readOnly={readOnly}
          pattern={pattern}
          className={`
            w-full px-4 py-3 border border-gray-300 rounded-xl 
            focus:ring-2 focus:ring-[#51946b] focus:border-[#51946b] 
            transition-all duration-200 ease-in-out
            ${icon ? "pl-10" : ""}
            ${readOnly ? "bg-gray-50 cursor-not-allowed" : "bg-white"}
            ${isFocused ? "shadow-md" : ""}
            ${hasValue ? "border-gray-400" : ""}
          `}
        />

        {/* Success check for filled required fields */}
        {required && hasValue && !isFocused && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
