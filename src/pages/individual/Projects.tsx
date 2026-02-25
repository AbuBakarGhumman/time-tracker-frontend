import React, { useState, useEffect } from "react";
import axios from "../../api/interceptor";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../../api/auth";
import { API_BASE_URL } from "../../api/config";
import { SkeletonTable } from "../../components/Skeleton";
import CacheManager from "../../utils/cacheManager";
import type { User } from "../../api/auth";

interface Project {
  id: number;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

const Projects: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(storedUser);
      loadProjects();
    }
  }, [navigate]);

  const loadProjects = async () => {
    try {
      // Debug: Check if token exists
      const token = localStorage.getItem("access_token");
      console.log("🔐 Access Token:", token ? `${token.substring(0, 20)}...` : "NOT FOUND");
      console.log("📦 API Base URL:", API_BASE_URL);

      // Check if cache is valid (not expired)
      if (CacheManager.isValid("projects", {})) {
        const cachedProjects = CacheManager.get<Project[]>("projects", {});
        if (cachedProjects) {
          setProjects(cachedProjects);
          setCurrentPage(1);
          setIsInitialLoading(false);
          return; // Don't fetch if cache is still valid
        }
      }

      // Cache is invalid or doesn't exist, fetch from API
      setIsInitialLoading(true);
      const res = await axios.get(`${API_BASE_URL}/projects/`);
      CacheManager.set("projects", res.data, {});
      setProjects(res.data);
      setCurrentPage(1);
    } catch (error: any) {
      console.error("❌ Failed to load projects:", error);
      console.error("📊 Error Status:", error?.response?.status);
      console.error("📋 Error Data:", error?.response?.data);
      console.error("🔗 Request URL:", error?.response?.config?.url);
      console.error("📤 Request Headers:", error?.response?.config?.headers);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, color: e.target.value }));
  };

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Project name is required");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/projects/`, formData);
      // Clear cache so fresh data is fetched
      CacheManager.clear("projects", {});
      await loadProjects();
      setFormData({ name: "", description: "", color: "#3b82f6" });
      setShowCreateModal(false);
    } catch (error: any) {
      alert(error?.response?.data?.detail || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProject || !formData.name.trim()) {
      alert("Project name is required");
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/projects/${editingProject.id}`, formData);
      // Clear cache so fresh data is fetched
      CacheManager.clear("projects", {});
      await loadProjects();
      setFormData({ name: "", description: "", color: "#3b82f6" });
      setEditingProject(null);
      setShowCreateModal(false);
    } catch (error: any) {
      alert(error?.response?.data?.detail || "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;

    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/projects/${projectId}`);
      // Clear cache so fresh data is fetched
      CacheManager.clear("projects", {});
      await loadProjects();
    } catch (error: any) {
      alert(error?.response?.data?.detail || "Failed to delete project");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      color: project.color,
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingProject(null);
    setFormData({ name: "", description: "", color: "#3b82f6" });
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedProject(null);
  };

  // Pagination logic
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = projects.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-1">
      {/* Tabs - Matching TimeTracker Style */}
      <div className="flex gap-4 mb-6 flex-wrap items-center justify-between">
        <button
          className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
        >
          My Projects
        </button>
        <button
          onClick={() => {
            setEditingProject(null);
            setFormData({ name: "", description: "", color: "#3b82f6" });
            setShowCreateModal(true);
          }}
          className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
        >
          + New Project
        </button>
      </div>

      {/* Projects Table */}
      {isInitialLoading ? (
        <SkeletonTable rows={5} />
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-900">All Projects</h2>
          </div>

          {projects.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01m-3-5h.01m-.01 4h.01" />
                </svg>
              <p>No Projects Yet</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Project Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Color</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">View</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Edit</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paginatedProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-900">{project.name}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                          {project.description || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-md border border-slate-300"
                              style={{ backgroundColor: project.color }}
                            />
                            <span className="text-sm text-slate-600 font-mono">{project.color}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(project.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleViewProject(project)}
                            disabled={loading}
                            className="inline-flex text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded transition-colors disabled:opacity-50"
                            title="View project details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => openEditModal(project)}
                            disabled={loading}
                            className="inline-flex text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-3 py-1 rounded transition-colors disabled:opacity-50"
                            title="Edit project"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            disabled={loading}
                            className="inline-flex text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors disabled:opacity-50"
                            title="Delete project"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {projects.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(endIndex, projects.length)}</span> of <span className="font-semibold">{projects.length}</span> projects
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || loading}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            page === currentPage
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || loading}
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
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold">Project Details</h3>
              <button
                onClick={closeDetailModal}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Project Name */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Project Name</h4>
                <p className="text-lg font-bold text-slate-900">{selectedProject.name}</p>
              </div>

              {/* Color and Created Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Color</h4>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-slate-300"
                      style={{ backgroundColor: selectedProject.color }}
                    />
                    <div>
                      <p className="text-sm font-mono text-slate-900">{selectedProject.color}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Created Date</h4>
                  <p className="text-slate-900 font-medium">
                    {new Date(selectedProject.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedProject.description && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Description</h4>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-slate-700 whitespace-pre-wrap break-words">{selectedProject.description}</p>
                  </div>
                </div>
              )}

              {/* Updated Date */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Last Updated</h4>
                <p className="text-slate-900 font-medium">
                  {new Date(selectedProject.updated_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex-shrink-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  closeDetailModal();
                  openEditModal(selectedProject);
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200"
              >
                Edit Project
              </button>
              <button
                onClick={closeDetailModal}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingProject ? "Edit Project" : "Create New Project"}</h3>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
              className="flex-1 overflow-y-auto px-6 py-4"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Project Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter project name"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter project description (optional)"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={handleColorChange}
                      className="w-12 h-12 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      readOnly
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? "Processing..." : editingProject ? "Update Project" : "Create Project"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;