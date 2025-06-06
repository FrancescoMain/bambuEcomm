"use client";
import React from "react";
import { useLoading } from "./LoadingContext";

const GlobalLoader = () => {
  const { loading } = useLoading();
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="w-16 h-16 border-4 border-[#39e079] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default GlobalLoader;
