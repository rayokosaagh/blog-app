// components/AnalyticsCharts.tsx
"use client";

import { Line, Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useIsDark } from "@/lib/useIsDark";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

interface AnalyticsChartsProps {
  monthlyPostData: Record<string, number>;
  publishedPosts: number;
  draftPosts: number;
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

export default function AnalyticsCharts({
  monthlyPostData,
  publishedPosts,
  draftPosts,
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

  // Content status
  const pieData = {
    labels: ["Published", "Drafts"],
    datasets: [
      {
        data: [publishedPosts, draftPosts],
        backgroundColor: ["#10b981", "#f59e0b"],
        borderWidth: 0,
        hoverOffset: 6,
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
      <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
        Analytics
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts over time - wide */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-6">
          <h3
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Posts over time
          </h3>
          <div className="h-64">
            <Line data={postsLineData} options={sharedLineOptions} />
          </div>
        </div>

        {/* Content status */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-6">
          <h3
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Content status
          </h3>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48">
              <Pie
                data={pieData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        color: isDark ? "#d4d4d8" : "#3f3f46",
                        font: { family: "var(--font-display)", size: 12 },
                        padding: 14,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* User growth */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-6">
          <h3
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            User growth
          </h3>
          <div className="h-56">
            <Line data={userGrowthData} options={sharedLineOptions} />
          </div>
        </div>

        {/* Rating distribution */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-6">
          <h3
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Rating distribution
          </h3>
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
        </div>

        {/* Newsletter growth */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-6">
          <h3
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Newsletter growth
          </h3>
          <div className="h-56">
            <Line data={newsletterData} options={sharedLineOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}