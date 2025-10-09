import React, { useEffect, useState } from "react";
import { BsCart3 } from "react-icons/bs";

interface OpenCartProps {
  className?: string;
  quantity?: number;
}

const OpenCart: React.FC<OpenCartProps> = ({ className = "", quantity }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Render a stable SSR output: icon only. Show badge only after mount.
  const showBadge = isMounted && Boolean(quantity);

  return (
    <div className="relative text-xl text-text-dark hover:text-primary dark:border-darkmode-border dark:text-white">
      <BsCart3 className={`dark:hover:text-darkmode-primary ${className}`} />

      <div
        className={`bg-black text-white dark:bg-white dark:text-black text-xs rounded-full p-1 absolute -top-1 md:-top-2 -right-3 md:-right-4 w-5 h-5 flex items-center justify-center ${showBadge ? "" : "hidden"}`}
      >
        {showBadge ? quantity : null}
      </div>
    </div>
  );
};

export default OpenCart;
