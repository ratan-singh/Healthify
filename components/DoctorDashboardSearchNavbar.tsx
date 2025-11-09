import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

export default function SearchBar({ placeholder = "Search...", onSearch }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce user input (wait 400ms after typing stops)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(handler);
  }, [query]);

  // Trigger search callback
  useEffect(() => {
    if (onSearch) onSearch(debouncedQuery.trim());
  }, [debouncedQuery, onSearch]);

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center bg-white border border-gray-300 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-violet-500">
        <Search className="ml-3 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-transparent focus:outline-none text-gray-700"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="p-2 mr-2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
