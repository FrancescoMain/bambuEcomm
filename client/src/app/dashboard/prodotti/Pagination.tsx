"use client";
import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="flex justify-center items-center gap-2 mt-4">
      <button
        className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        &lt;
      </button>
      <span>
        Pagina {currentPage} di {totalPages}
      </span>
      <button
        className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        &gt;
      </button>
    </div>
  );
}
