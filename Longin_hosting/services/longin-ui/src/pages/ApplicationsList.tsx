import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Server, Activity, GitBranch } from 'lucide-react';
import api from '../services/api';

interface Application {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'building';
  port: number;
  github_repo_url?: string;
  github_branch: string;
  created_at: string;
}

const ApplicationsList: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [newAppName, setNewAppName] = useState('');
  const [newAppRepo, setNewAppRepo] = useState('');
  const [newAppBranch, setNewAppBranch] = useState('main');
  const [createError, setCreateError] = useState('');

  const fetchApplications = async () => {
    try {
      const response = await api.get('/applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      await api.post('/applications', {
        name: newAppName,
        github_repo_url: newAppRepo,
        github_branch: newAppBranch,
        auto_deploy: true
      });
      setShowCreateModal(false);
      setNewAppName('');
      setNewAppRepo('');
      fetchApplications();
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Failed to create application');
    }
  };

  if (loading) return <div className="text-gray-400">Loading applications...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-white">Applications</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        >
          <Plus size={18} />
          <span>New Application</span>
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <Server className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-white">No applications found</h3>
          <p className="text-gray-400 mt-2">Get started by creating your first application.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <Link
              key={app.id}
              to={`/dashboard/applications/${app.id}`}
              className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition">
                    {app.name}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                    app.status === 'running' ? 'bg-green-900 text-green-300' :
                    app.status === 'error' ? 'bg-red-900 text-red-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {app.status}
                  </span>
                </div>
                <Activity size={20} className={
                  app.status === 'running' ? 'text-green-400' : 'text-gray-500'
                } />
              </div>
              
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <Server size={14} />
                  <span>Port: {app.port}</span>
                </div>
                {app.github_repo_url && (
                  <div className="flex items-center space-x-2 truncate">
                    <GitBranch size={14} />
                    <span className="truncate">{app.github_repo_url} ({app.github_branch})</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-white">Create New Application</h3>
            {createError && <div className="bg-red-500 text-white p-2 rounded mb-4 text-sm">{createError}</div>}
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Application Name</label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="my-awesome-app"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">GitHub Repo URL</label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
                  value={newAppRepo}
                  onChange={(e) => setNewAppRepo(e.target.value)}
                  placeholder="https://github.com/user/repo"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-400 mb-2">Branch</label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
                  value={newAppBranch}
                  onChange={(e) => setNewAppBranch(e.target.value)}
                  placeholder="main"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsList;
