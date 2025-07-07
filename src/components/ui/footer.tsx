"use client";

import { ArrowUp } from "lucide-react";

function handleScrollTop() {
  window.scroll({
    top: 0,
    behavior: "smooth",
  });
}

const Footer = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center">
        <button 
          type="button" 
          onClick={handleScrollTop}
          className="rounded-full p-2 hover:bg-white/10 transition-colors"
        >
          <ArrowUp className="h-5 w-5 text-white" />
          <span className="sr-only">Top</span>
        </button>
      </div>
    </div>
  );
};

export default Footer; 