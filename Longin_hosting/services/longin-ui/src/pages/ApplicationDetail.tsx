import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Square, RefreshCw, GitBranch, Clock, Globe, CheckCircle, AlertCircle, Save } from 'lucide-react';
import api from '../services/api';
import LogTerminal from '../components/LogTerminal';
import MetricsGraph from '../components/MetricsGraph';

interface Container {
  id: string;
  docker_container_id: string;
  status: string;
  internal_port: number;
}

interface Deployment {
  id: string;
  status: string;
  created_at: string;
  commit_sha: string;
}

interface Application {
  id: string;
  name: string;
  slug: string;
  status: 'running' | 'stopped' | 'error' | 'building';
  port: number;
  github_repo_url?: string;
  github_branch: string;
  env_vars?: Record<string, string>;
  public_url?: string;
  containers: Container[];
  deployments: Deployment[];
}

const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'settings'>('overview');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApp = async () => {
    try {
      const response = await api.get(`/applications/${id}`);
      setApp(response.data);
    } catch (error) {
      console.error('Failed to fetch application', error);
      navigate('/dashboard/applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchApp();
  }, [id]);

  const handleDeploy = async () => {
    if (!app) return;
    setActionLoading(true);
    try {
      await api.post(`/applications/${app.id}/deploy`, {
        version: 'latest', // or specific commit
        config: {
          image: 'nginx:latest', // Placeholder, needs to be dynamic or built from git
          env: []
        }
      });
      // Poll for status or wait
      setTimeout(fetchApp, 2000);
    } catch (error) {
      console.error('Deploy failed', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleContainerAction = async (action: 'start' | 'stop' | 'restart') => {
    const container = app?.containers[0]; // Assuming single container for now
    if (!container?.docker_container_id) return;

    setActionLoading(true);
    try {
      await api.post(`/docker/containers/${container.docker_container_id}/${action}`);
      setTimeout(fetchApp, 1000);
    } catch (error) {
      console.error(`${action} failed`, error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!app) return <div>Application not found</div>;

  const activeContainer = app.containers[0];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b border-gray-700 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{app.name}</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${
                app.status === 'running' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="uppercase">{app.status}</span>
            </div>
            <span>Port: {app.port}</span>
            {app.github_repo_url && (
              <div className="flex items-center space-x-1">
                <GitBranch size={14} />
                <span>{app.github_branch}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleDeploy}
            disabled={actionLoading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
          >
            <RefreshCw size={18} />
            <span>Deploy</span>
          </button>
          {activeContainer && (
            <>
              {app.status !== 'running' ? (
                <button
                  onClick={() => handleContainerAction('start')}
                  disabled={actionLoading}
                  className="bg-green-700 hover:bg-green-600 text-white p-2 rounded transition disabled:opacity-50"
                  title="Start"
                >
                  <Play size={20} />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleContainerAction('restart')}
                    disabled={actionLoading}
                    className="bg-yellow-700 hover:bg-yellow-600 text-white p-2 rounded transition disabled:opacity-50"
                    title="Restart"
                  >
                    <RefreshCw size={20} />
                  </button>
                  <button
                    onClick={() => handleContainerAction('stop')}
                    disabled={actionLoading}
                    className="bg-red-700 hover:bg-red-600 text-white p-2 rounded transition disabled:opacity-50"
                    title="Stop"
                  >
                    <Square size={20} />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-6 border-b border-gray-700 mb-6">
        {['overview', 'logs', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 capitalize font-medium transition ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {activeContainer && app.status === 'running' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MetricsGraph containerId={activeContainer.docker_container_id} type="cpu" />
                    <MetricsGraph containerId={activeContainer.docker_container_id} type="memory" color="#10b981" />
                </div>
            )}

            <div>
              <h3 className="text-lg font-bold text-white mb-4">Environment Variables</h3>
              <div className="bg-gray-900 p-4 rounded font-mono text-sm text-gray-300">
                {app.env_vars ? (
                  Object.entries(app.env_vars).map(([key, value]) => (
                    <div key={key} className="flex space-x-2">
                      <span className="text-blue-400">{key}=</span>
                      <span>{value}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500">No environment variables set</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4">Recent Deployments</h3>
              <div className="space-y-4">
                {app.deployments?.slice(0, 5).map((deploy) => (
                  <div key={deploy.id} className="flex justify-between items-center border-b border-gray-700 pb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        deploy.status === 'success' ? 'bg-green-500' :
                        deploy.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <span className="font-mono text-sm text-gray-300">{deploy.commit_sha.substring(0, 7)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock size={14} />
                      <span>{new Date(deploy.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <LogTerminal appId={app.id} className="h-[600px]" />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <Globe className="text-blue-400" />
                <span>Public URL Configuration</span>
              </h3>
              <p className="text-gray-400 mb-6">
                Configure the public URL where your application will be accessible.
              </p>

              <UrlConfiguration appId={app.id} initialUrl={app.public_url} onUpdate={fetchApp} />
            </div>

            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Danger Zone</h3>
                <p className="text-gray-400 mb-4">Irreversible actions.</p>
                <button className="bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 px-4 py-2 rounded transition">
                    Delete Application
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UrlConfiguration: React.FC<{ appId: string; initialUrl?: string; onUpdate: () => void }> = ({ appId, initialUrl, onUpdate }) => {
  const [url, setUrl] = useState(initialUrl || '');
  const [status, setStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setUrl(initialUrl || '');
  }, [initialUrl]);

  const validateUrl = async () => {
    if (!url) return;
    setStatus('checking');
    try {
      const res = await api.post('/applications/validate-url', { url, appId });
      if (res.data.valid) {
        setStatus('valid');
        setMessage(res.data.message + (res.data.reachable ? ' (Reachable)' : ' (Not reachable yet)'));
      } else {
        setStatus('invalid');
        setMessage(res.data.message);
      }
    } catch (err: any) {
      setStatus('invalid');
      setMessage(err.response?.data?.error || 'Validation failed');
    }
  };

  const saveUrl = async () => {
    setIsSaving(true);
    try {
      await api.patch(`/applications/${appId}`, { public_url: url });
      onUpdate();
      alert('URL updated successfully');
    } catch (err) {
      alert('Failed to update URL');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Public URL</label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setStatus('idle');
            }}
            placeholder="https://myapp.example.com"
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={validateUrl}
            disabled={!url || status === 'checking'}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition disabled:opacity-50"
          >
            {status === 'checking' ? 'Checking...' : 'Check Availability'}
          </button>
        </div>
        {status !== 'idle' && (
          <div className={`mt-2 flex items-center space-x-2 text-sm ${
            status === 'valid' ? 'text-green-400' : 'text-red-400'
          }`}>
            {status === 'valid' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{message}</span>
          </div>
        )}
      </div>

      <div className="pt-2">
        <button
          onClick={saveUrl}
          disabled={isSaving || status === 'invalid' || !url}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
        >
          <Save size={18} />
          <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>
    </div>
  );
};

export default ApplicationDetail;
