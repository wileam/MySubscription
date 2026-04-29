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
        className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
      />
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
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
