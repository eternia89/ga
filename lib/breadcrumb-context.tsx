'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface BreadcrumbContextValue {
  segments: BreadcrumbSegment[];
  setSegments: (segments: BreadcrumbSegment[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  segments: [],
  setSegments: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [segments, setSegments] = useState<BreadcrumbSegment[]>([]);
  return (
    <BreadcrumbContext.Provider value={{ segments, setSegments }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

/**
 * Drop this into any page to set the header breadcrumb.
 * Renders nothing — just pushes segments into context on mount.
 */
export function SetBreadcrumbs({ items }: { items: BreadcrumbSegment[] }) {
  const { setSegments } = useContext(BreadcrumbContext);
  useEffect(() => {
    setSegments(items);
    return () => setSegments([]);
  }, [items, setSegments]);
  return null;
}

/**
 * Renders the breadcrumb trail in the header.
 */
export function HeaderBreadcrumb() {
  const { segments } = useContext(BreadcrumbContext);

  if (segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          return (
            <BreadcrumbItem key={i}>
              {isLast ? (
                <BreadcrumbPage className="max-w-[300px] truncate">
                  {seg.label}
                </BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink asChild>
                    <Link href={seg.href!}>{seg.label}</Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
