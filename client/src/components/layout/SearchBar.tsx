"use client";

import React from "react";

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Cerca...",
  className = "",
}) => {
  // Handle form submit (Enter or button click)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit();
  };
  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col min-w-40 h-12 w-full ${className}`}
    >
      <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
        <input
          type="text"
          placeholder={placeholder}
          className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0e1a13] focus:outline-0 focus:ring-0 border-none bg-[#e8f2ec] focus:border-none h-full placeholder:text-[#51946b] px-4 rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
          value={value}
          onChange={onChange}
        />
        <button
          type="submit"
          className="text-[#51946b] flex border-none bg-[#e8f2ec] items-center justify-center px-4 rounded-r-lg border-l-0 hover:bg-[#d2e7db] transition-colors"
          aria-label="Cerca"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24px"
            height="24px"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
          </svg>
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
