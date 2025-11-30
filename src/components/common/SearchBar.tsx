import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect, useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  delay?: number;
  onSearch: (value: string) => void;
  initialValue?: string;
}

export function SearchBar({ placeholder = "Search...", delay = 350, onSearch, initialValue = "" }: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const debounced = useDebounce(value, delay);

  useEffect(() => {
    onSearch(debounced);
  }, [debounced, onSearch]);

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        aria-label="Search"
      />
    </div>
  );
}
