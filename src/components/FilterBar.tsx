"use client";

interface FilterBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  language: string;
  onLanguageChange: (l: string) => void;
  languages: string[];
}

export default function FilterBar({
  query,
  onQueryChange,
  language,
  onLanguageChange,
  languages,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        type="search"
        placeholder="Search repositories…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-gray-600"
      />
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-gray-600"
      >
        <option value="">All languages</option>
        {languages.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
