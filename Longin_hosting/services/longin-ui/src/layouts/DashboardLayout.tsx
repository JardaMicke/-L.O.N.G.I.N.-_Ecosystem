import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Box, Settings } from 'lucide-react';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-blue-400">Longin Hosting</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard" className="flex items-center space-x-3 p-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition">
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </Link>
          <Link to="/dashboard/applications" className="flex items-center space-x-3 p-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition">
            <Box size={20} />
            <span>Applications</span>
          </Link>
          <Link to="/dashboard/settings" className="flex items-center space-x-3 p-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition">
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium truncate">{user?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition w-full"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-gray-800 border-b border-gray-700 p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Dashboard</h2>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
