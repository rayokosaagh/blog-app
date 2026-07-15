// components/AnalyticsCharts.tsx
"use client";

import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { FileText, Users, Star, Mail } from "lucide-react";
import { useIsDark } from "@/lib/useIsDark";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

interface AnalyticsChartsProps {
  monthlyPostData: Record<string, number>;
  publishedPosts: number;
  monthlyUserData: Record<string, number>;
  ratingDistribution: Record<number, number>;
  monthlySubscriberData: Record<string, number>;
}

function makeAreaGradient(hexColor: string) {
  return (ctx: any) => {
    const chart = ctx.chart;
    const { ctx: c, chartArea } = chart;
    if (!chartArea) return `${hexColor}22`;
    const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    const rgb = hexToRgb(hexColor);
    gradient.addColorStop(0, `rgba(${rgb},0.25)`);
    gradient.addColorStop(1, `rgba(${rgb},0)`);
    return gradient;
  };
}

function hexToRgb(hex: string) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  return `${(bigint >> 16) & 255},${(bigint >> 8) & 255},${bigint & 255}`;
}

// Card wrapper with a colored 3px top accent bar — the one recurring
// "modern SaaS" tell across the whole grid.
function ChartCard({
  accent,
  title,
  children,
  wide,
}: {
  accent: string;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`${wide ? "lg:col-span-2" : ""} bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden`}
    >
      <div className="h-1" style={{ backgroundColor: accent }} />
      <div className="p-6">
        <h3
          className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-5"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tint,
  text,
}: {
  icon: any;
  label: string;
  value: string | number;
  tint: string;
  text: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-5 flex items-center gap-4">
      <div
        className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: tint }}
      >
        <Icon className="h-5 w-5" style={{ color: text }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
          {value}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{label}</p>
      </div>
    </div>
  );
}

export default function AnalyticsCharts({
  monthlyPostData,
  publishedPosts,
  monthlyUserData,
  ratingDistribution,
  monthlySubscriberData,
}: AnalyticsChartsProps) {
  const isDark = useIsDark();
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const tickColor = isDark ? "#71717a" : "#a1a1aa";
  const labelFont = { family: "var(--font-mono)", size: 11 };

  const sharedLineOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: tickColor, font: labelFont } },
      y: { grid: { color: gridColor }, ticks: { color: tickColor, font: labelFont } },
    },
  };

  // --- Metric totals for the summary row ---
  const totalPosts = publishedPosts;
  const totalNewUsers = Object.values(monthlyUserData).reduce((a, b) => a + b, 0);
  const totalSubscribers = Object.values(monthlySubscriberData).reduce((a, b) => a + b, 0);
  const ratingEntries = Object.entries(ratingDistribution);
  const ratingCount = ratingEntries.reduce((sum, [, c]) => sum + c, 0);
  const ratingSum = ratingEntries.reduce((sum, [star, c]) => sum + Number(star) * c, 0);
  const avgRating = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : "—";

  // Posts over time
  const postMonths = Object.keys(monthlyPostData);
  const postsLineData = {
    labels: postMonths.length ? postMonths : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Posts created",
        data: postMonths.length ? Object.values(monthlyPostData) : [3, 7, 4, 8, 12, 5],
        borderColor: "#3b82f6",
        backgroundColor: makeAreaGradient("#3b82f6"),
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#3b82f6",
        borderWidth: 2.5,
      },
    ],
  };

  // User growth
  const userMonths = Object.keys(monthlyUserData);
  const userGrowthData = {
    labels: userMonths.length ? userMonths : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "New users",
        data: userMonths.length ? Object.values(monthlyUserData) : [1, 2, 1, 3, 2, 4],
        borderColor: "#8b5cf6",
        backgroundColor: makeAreaGradient("#8b5cf6"),
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#8b5cf6",
        borderWidth: 2.5,
      },
    ],
  };

  // Rating distribution
  const ratingBarData = {
    labels: ["1★", "2★", "3★", "4★", "5★"],
    datasets: [
      {
        label: "Ratings",
        data: [1, 2, 3, 4, 5].map((v) => ratingDistribution[v] ?? 0),
        backgroundColor: "#f59e0b",
        borderRadius: 6,
        maxBarThickness: 28,
      },
    ],
  };

  // Newsletter growth
  const subMonths = Object.keys(monthlySubscriberData);
  const newsletterData = {
    labels: subMonths.length ? subMonths : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "New subscribers",
        data: subMonths.length ? Object.values(monthlySubscriberData) : [2, 4, 3, 6, 5, 8],
        borderColor: "#06b6d4",
        backgroundColor: makeAreaGradient("#06b6d4"),
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#06b6d4",
        borderWidth: 2.5,
      },
    ],
  };

  return (
    <div>
      <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
        Analytics
      </p>

      {/* Summary metric row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={FileText}
          label="Published posts"
          value={totalPosts}
          tint={isDark ? "rgba(59,130,246,0.15)" : "#eff6ff"}
          text="#3b82f6"
        />
        <MetricCard
          icon={Users}
          label="New users"
          value={totalNewUsers}
          tint={isDark ? "rgba(139,92,246,0.15)" : "#f5f3ff"}
          text="#8b5cf6"
        />
        <MetricCard
          icon={Star}
          label="Avg rating"
          value={avgRating}
          tint={isDark ? "rgba(245,158,11,0.15)" : "#fffbeb"}
          text="#f59e0b"
        />
        <MetricCard
          icon={Mail}
          label="New subscribers"
          value={totalSubscribers}
          tint={isDark ? "rgba(6,182,212,0.15)" : "#ecfeff"}
          text="#06b6d4"
        />
      </div>

      {/* Feature chart, full width */}
      <ChartCard accent="#3b82f6" title="Posts over time">
        <div className="h-64">
          <Line data={postsLineData} options={sharedLineOptions} />
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <ChartCard accent="#8b5cf6" title="User growth">
          <div className="h-56">
            <Line data={userGrowthData} options={sharedLineOptions} />
          </div>
        </ChartCard>

        <ChartCard accent="#f59e0b" title="Rating distribution">
          <div className="h-56">
            <Bar
              data={ratingBarData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { color: tickColor, font: labelFont } },
                  y: {
                    grid: { color: gridColor },
                    ticks: { color: tickColor, font: labelFont, precision: 0 },
                  },
                },
              }}
            />
          </div>
        </ChartCard>

        <ChartCard accent="#06b6d4" title="Newsletter growth">
          <div className="h-56">
            <Line data={newsletterData} options={sharedLineOptions} />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}