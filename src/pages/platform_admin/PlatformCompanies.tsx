import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredPlatformAdmin } from "../../api/auth";
import { getCompanies, toggleCompanyActive } from "../../api/platform_admin";
import type { PlatformCompany } from "../../api/platform_admin";
import { API_BASE_URL } from "../../api/config";

const PlatformCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<PlatformCompany[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const a = getStoredPlatformAdmin();
    if (!a) { navigate("/login"); return; }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [activeFilter, currentPage]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params: any = { skip: (currentPage - 1) * limit, limit };
      if (activeFilter !== "all") params.is_active = activeFilter === "true";
      if (search.trim()) params.search = search.trim();
      const data = await getCompanies(params);
      setCompanies(data.companies);
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
    fetchCompanies();
  };

  const handleToggleActive = async (companyId: number) => {
    try {
      await toggleCompanyActive(companyId);
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, is_active: !c.is_active } : c))
      );
    } catch (e) {
      console.error(e);
    }
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

  return (
    <div className="p-1 space-y-6">
        {/* Tab */}
        <div className="flex gap-3 flex-wrap">
          <button
            className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
          >
            Companies
          </button>
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
                placeholder="Search by company name or email..."
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

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : companies.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 px-6 py-16 text-center text-slate-400 text-sm">
            No companies found
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Industry</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Employees</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {companies.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {c.company_logo_url ? (
                            <img src={`${API_BASE_URL}${c.company_logo_url}`} alt={c.company_name} className="w-9 h-9 rounded-lg object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 text-xs font-bold">{c.company_name[0]}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-900">{c.company_name}</p>
                            <p className="text-xs text-slate-500">{c.company_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {c.industry || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                        {c.employee_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {c.subscription_plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {c.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleToggleActive(c.id)}
                          className={`inline-flex px-3 py-1 rounded text-sm font-medium transition-colors ${
                            c.is_active
                              ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                              : "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                          }`}
                        >
                          {c.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              {/* Pagination */}
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
          </div>
        )}
    </div>
  );
};

export default PlatformCompanies;
