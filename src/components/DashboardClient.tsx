"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

interface Post {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: string;
  author: { name: string };
}

interface DashboardClientProps {
  initialRecentPosts: Post[];
  monthlyData: Record<string, number>;
  publishedPosts: number;
  draftPosts: number;
}

export default function DashboardClient({
  initialRecentPosts,
  monthlyData,
  publishedPosts,
  draftPosts,
}: DashboardClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredPosts = useMemo(() => {
    return initialRecentPosts.filter((post) => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PUBLISHED" && post.published) ||
        (statusFilter === "DRAFT" && !post.published);
      return matchesSearch && matchesStatus;
    });
  }, [initialRecentPosts, searchTerm, statusFilter]);

  // Line Chart Data
  const months = Object.keys(monthlyData);
  const lineData = {
    labels: months.length ? months : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [{
      label: "Posts Created",
      data: months.length ? Object.values(monthlyData) : [3, 7, 4, 8, 12, 5],
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      tension: 0.4,
      fill: true,
    }],
  };

  // Pie Chart Data
  const pieData = {
    labels: ["Published", "Drafts"],
    datasets: [{
      data: [publishedPosts, draftPosts],
      backgroundColor: ["#10b981", "#eab308"],
      borderWidth: 0,
    }],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Analytics Charts */}
      <div className="lg:col-span-3 space-y-8">
        {/* Posts Over Time */}
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Posts Over Time</h3>
          <div className="h-80">
            <Line data={lineData} options={{ maintainAspectRatio: false, responsive: true }} />
          </div>
        </div>

        {/* Published vs Drafts */}
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Content Status</h3>
          <div className="h-80 flex items-center justify-center">
            <div className="w-80">
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden h-full flex flex-col">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Recent Posts</h2>
            <Link href="/dashboard/posts" className="text-blue-600 hover:underline text-sm">View all →</Link>
          </div>

          {/* Search + Filter */}
          <div className="p-6 border-b flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="w-full sm:w-44 border border-gray-300 rounded-2xl px-4 py-3 bg-white flex justify-between items-center"
              >
                {statusFilter === "ALL" ? "All Posts" : statusFilter === "PUBLISHED" ? "Published" : "Drafts"}
                <span>▼</span>
              </button>

              {showFilterDropdown && (
                <div className="absolute mt-2 w-full bg-white rounded-2xl shadow-xl border py-2 z-50">
                  {["ALL", "PUBLISHED", "DRAFT"].map((val) => (
                    <div
                      key={val}
                      onClick={() => { setStatusFilter(val as any); setShowFilterDropdown(false); }}
                      className={`px-5 py-3 hover:bg-gray-100 cursor-pointer ${statusFilter === val ? "bg-blue-50 text-blue-700" : ""}`}
                    >
                      {val === "ALL" ? "All Posts" : val === "PUBLISHED" ? "Published" : "Drafts"}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {filteredPosts.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No posts found</div>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} className="p-6 border-b hover:bg-gray-50 transition-all">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        By {post.author.name} • {new Date(post.createdAt).toDateString()}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full self-start ${
                      post.published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}