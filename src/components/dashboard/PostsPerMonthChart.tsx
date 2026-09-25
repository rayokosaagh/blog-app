"use client";

import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from "chart.js";
import { useIsDark } from "@/lib/useIsDark";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

/**
 * Posts created per calendar month, oldest first. Bars rather than a smoothed
 * line: with a handful of months, curve smoothing invents peaks and slopes
 * between points that the data doesn't have.
 */
export default function PostsPerMonthChart({
  months,
}: {
  months: { label: string; count: number }[];
}) {
  const isDark = useIsDark();
  const ink = isDark ? "#a1a1aa" : "#71717a";
  const grid = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";

  return (
    <div className="h-56">
      <Bar
        data={{
          labels: months.map((m) => m.label),
          datasets: [
            {
              label: "Posts",
              data: months.map((m) => m.count),
              backgroundColor: isDark ? "#60a5fa" : "#3b82f6",
              borderRadius: 4,
              maxBarThickness: 36,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: ink }, border: { display: false } },
            y: {
              beginAtZero: true,
              ticks: { color: ink, precision: 0 },
              grid: { color: grid },
              border: { display: false },
            },
          },
        }}
      />
    </div>
  );
}
