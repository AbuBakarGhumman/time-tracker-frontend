import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getStoredPlatformAdmin } from "../../api/auth";
import { getUsers, toggleUserActive } from "../../api/platform_admin";
import type { PlatformUser } from "../../api/platform_admin";

const PlatformUsers: React.FC = () => {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const a = getStoredPlatformAdmin();
    if (!a) { navigate("/login"); return; }
    if (searchParams.get("filter") === "inactive") {
      setActiveFilter("false");
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [accountTypeFilter, activeFilter, currentPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = { skip: (currentPage - 1) * limit, limit };
      if (accountTypeFilter !== "all") params.account_type = accountTypeFilter;
      if (activeFilter !== "all") params.is_active = activeFilter === "true";
      if (search.trim()) params.search = search.trim();
      const data = await getUsers(params);
      setUsers(data.users);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleToggleActive = async (userId: number) => {
    try {
      await toggleUserActive(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active } : u))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const accountTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      individual: "bg-sky-100 text-sky-800",
      employee: "bg-emerald-100 text-emerald-800",
      platform_admin: "bg-purple-100 text-purple-800",
    };
    const labels: Record<string, string> = {
      individual: "Individual",
      employee: "Employee",
      platform_admin: "Admin",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type] || "bg-slate-100 text-slate-800"}`}>
        {labels[type] || type}
      </span>
    );
  };

  const totalPages = Math.ceil(total / limit);
  const startIndex = (currentPage - 1) * limit;
  const endIndex = Math.min(currentPage * limit, total);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const typeFilterTabs = [
    { key: "all", label: "All Users" },
    { key: "individual", label: "Individual" },
    { key: "employee", label: "Employee" },
    { key: "platform_admin", label: "Admin" },
  ];

  return (
    <div className="p-1 space-y-6">
        {/* Tabs */}
        <div className="flex gap-3 flex-wrap">
          {typeFilterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setAccountTypeFilter(tab.key); setCurrentPage(1); }}
              className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 text-sm ${
                accountTypeFilter === tab.key
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 flex gap-4 flex-wrap items-center">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or username..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </form>

          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            {[
              { key: "all", label: "All" },
              { key: "true", label: "Active" },
              { key: "false", label: "Inactive" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setActiveFilter(opt.key); setCurrentPage(1); }}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${
                  activeFilter === opt.key
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-400 text-sm">No users found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">
                                {u.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{u.full_name}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{accountTypeBadge(u.account_type)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleToggleActive(u.id)}
                            className={`inline-flex px-3 py-1 rounded text-sm font-medium transition-colors ${
                              u.is_active
                                ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                                : "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                            }`}
                          >
                            {u.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{endIndex}</span> of <span className="font-semibold">{total}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, i) =>
                        page === "..." ? (
                          <span key={`dots-${i}`} className="px-2 text-slate-400">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page as number)}
                            className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200 ${
                              currentPage === page
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
    </div>
  );
};

export default PlatformUsers;
