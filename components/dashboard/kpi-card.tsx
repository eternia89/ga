'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Trend {
  direction: 'up' | 'down' | 'flat';
  percentage: number;
}

interface KpiCardProps {
  title: string;
  value: number | string;
  trend?: Trend;
  href: string;
  icon: ReactNode;
  color?: string;
  /** When true, an "up" trend is good (green). When false, "up" is bad (red). */
  trendIsGood?: boolean;
}

export function KpiCard({
  title,
  value,
  trend,
  href,
  icon,
  trendIsGood = true,
}: KpiCardProps) {
  const getTrendColor = () => {
    if (!trend || trend.direction === 'flat') return 'text-muted-foreground';
    const isPositiveChange = trend.direction === 'up';
    if (trendIsGood) {
      // For metrics where up is good (e.g., Completed): up = green, down = red
      return isPositiveChange ? 'text-green-600' : 'text-red-600';
    } else {
      // For metrics where up is bad (e.g., Open Requests, Overdue): up = red, down = green
      return isPositiveChange ? 'text-red-600' : 'text-green-600';
    }
  };

  const TrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'flat') {
      return <Minus className="h-3.5 w-3.5" />;
    }
    if (trend.direction === 'up') {
      return <TrendingUp className="h-3.5 w-3.5" />;
    }
    return <TrendingDown className="h-3.5 w-3.5" />;
  };

  const trendColor = getTrendColor();

  return (
    <Link href={href} className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
      <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-5">
        {/* Top row: icon + title */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm text-muted-foreground font-medium leading-tight">
            {title}
          </span>
        </div>

        {/* Value */}
        <div className="text-3xl font-bold text-foreground mb-2">
          {value}
        </div>

        {/* Trend indicator */}
        {trend ? (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
            <TrendIcon />
            {trend.direction === 'flat' ? (
              <span>No change</span>
            ) : (
              <span>
                {trend.percentage}% vs prev period
              </span>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">No comparison data</div>
        )}
      </CardContent>
      </Card>
    </Link>
  );
}
