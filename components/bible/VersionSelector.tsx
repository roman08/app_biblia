"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DEFAULT_VERSION, VERSIONS, type VersionKey } from "@/lib/bible-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface VersionSelectorProps {
  current: VersionKey;
}

export function VersionSelector({ current }: VersionSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelect = (version: VersionKey) => {
    const params = new URLSearchParams(searchParams.toString());
    // La versión por defecto va sin ?v= (una sola URL por capítulo)
    if (version === DEFAULT_VERSION) params.delete("v");
    else params.set("v", version);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            {VERSIONS[current].shortName}
            <ChevronDown className="h-4 w-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        {(Object.keys(VERSIONS) as VersionKey[]).map((key) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleSelect(key)}
            className={key === current ? "font-semibold" : ""}
          >
            {VERSIONS[key].name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}