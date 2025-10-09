import React, { useCallback, useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import { IoSearch, IoClose } from "react-icons/io5";
import { createUrl } from "@/lib/utils";

const DEBOUNCE_DELAY = 500; // ms

const SearchBar = () => {
  const [isInputEditing, setInputEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeout = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const query = searchParams.get("q");
    if (query) {
      setInputValue(query);
      setInputEditing(true);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !isInputEditing) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape" && isInputEditing) {
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isInputEditing]);

  const updateURL = useCallback((query: string, shouldDebounce = false) => {
    setIsLoading(true);
    const searchParams = new URLSearchParams(window.location.search);
    
    if (query) {
      searchParams.set('q', query);
    } else {
      searchParams.delete('q');
    }

    const newURL = createUrl('/products', searchParams);

    if (shouldDebounce) {
      if (searchTimeout.current) {
        window.clearTimeout(searchTimeout.current);
      }
      searchTimeout.current = window.setTimeout(() => {
        window.history.pushState({}, '', newURL);
        window.dispatchEvent(new Event('popstate'));
        setIsLoading(false);
      }, DEBOUNCE_DELAY);
    } else {
      window.history.pushState({}, '', newURL);
      window.dispatchEvent(new Event('popstate'));
      setIsLoading(false);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputEditing(true);
    setInputValue(newValue);
    updateURL(newValue, true);
  }, [updateURL]);

  const handleClear = useCallback(() => {
    setInputValue("");
    setInputEditing(false);
    if (searchTimeout.current) {
      window.clearTimeout(searchTimeout.current);
    }
    updateURL("");
  }, [updateURL]);

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const searchInput = form.search as HTMLInputElement;
    if (searchTimeout.current) {
      window.clearTimeout(searchTimeout.current);
    }
    updateURL(searchInput.value);
  }, [updateURL]);

  return (
    <form 
      onSubmit={onSubmit} 
      role="search"
      className="border border-border dark:border-darkmode-border rounded-full flex bg-light/90 dark:bg-dark/10 pl-4 relative"
    >
      <input
        ref={inputRef}
        type="search"
        name="search"
        placeholder="Search for products (Press / to focus)"
        autoComplete="off"
        value={inputValue}
        onChange={handleChange}
        id="searchInput"
        aria-label="Search products"
        aria-expanded={isInputEditing}
        aria-controls="search-results"
        className="bg-transparent border-none search-input focus:ring-transparent p-2 w-full"
      />
      <div className="absolute right-0 top-0 flex h-full items-center">
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="p-2 m-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark/30"
            aria-label="Clear search"
          >
            <IoClose className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <button type="submit" className="search-icon p-2 m-1 rounded-full"
           aria-label="Search"
          disabled={isLoading}
        >
          <IoSearch className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
