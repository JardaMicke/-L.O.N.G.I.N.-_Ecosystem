import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Overview: React.FC = () => {
  const [stats, setStats] = useState({
    totalApps: 0,
    runningContainers: 0,
    deployments: 0 // We might not get this easily without a dedicated endpoint, but we can try
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const appsRes = await api.get('/applications');
        const apps = appsRes.data;
        
        const totalApps = apps.length;
        const runningContainers = apps.filter((app: any) => app.status === 'running').length;
        
        // For deployments count, we might need a separate call or check deployments relation if included
        // Assuming apps response includes deployments relation
        const totalDeployments = apps.reduce((acc: number, app: any) => acc + (app.deployments?.length || 0), 0);

        setStats({
          totalApps,
          runningContainers,
          deployments: totalDeployments
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading stats...</div>;

  return (
    <div>
      <h3 className="text-2xl font-bold text-white mb-6">Welcome back!</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
          <h4 className="text-gray-400 text-sm font-medium">Total Applications</h4>
          <p className="text-3xl font-bold text-white mt-2">{stats.totalApps}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
          <h4 className="text-gray-400 text-sm font-medium">Running Containers</h4>
          <p className="text-3xl font-bold text-green-400 mt-2">{stats.runningContainers}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
          <h4 className="text-gray-400 text-sm font-medium">Total Deployments</h4>
          <p className="text-3xl font-bold text-blue-400 mt-2">{stats.deployments}</p>
        </div>
      </div>
    </div>
  );
};

export default Overview;
