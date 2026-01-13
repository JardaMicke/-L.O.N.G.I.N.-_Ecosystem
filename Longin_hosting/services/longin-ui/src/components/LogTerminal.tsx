import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Terminal, Search, ArrowDownCircle, PauseCircle } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  log: string;
}

interface LogTerminalProps {
  appId: string;
  className?: string;
}

const LogTerminal: React.FC<LogTerminalProps> = ({ appId, className = '' }) => {
  const socket = useSocket();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe
    socket.subscribeLogs(appId);
    setIsConnected(socket.isConnected());

    const handleLog = (data: { appId: string; log: string; timestamp: string }) => {
      if (data.appId === appId) {
        setLogs((prev) => [...prev, { log: data.log, timestamp: data.timestamp }]);
      }
    };

    socket.on('app:log', handleLog);
    
    // Check connection status periodically or listen to connect event
    const checkConnection = setInterval(() => {
        setIsConnected(socket.isConnected());
    }, 1000);

    return () => {
      socket.unsubscribeLogs(appId);
      socket.off('app:log', handleLog);
      clearInterval(checkConnection);
    };
  }, [appId, socket]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((l) => 
    l.log.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className={`flex flex-col bg-gray-900 rounded-lg overflow-hidden border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2 text-gray-300">
          <Terminal size={18} />
          <span className="font-mono text-sm">Terminal Output</span>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? 'Connected' : 'Disconnected'} />
        </div>
        <div className="flex items-center space-x-2">
            <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" size={14} />
                <input 
                    type="text" 
                    placeholder="Filter logs..." 
                    className="bg-gray-900 text-gray-300 text-xs rounded pl-8 pr-2 py-1 border border-gray-700 focus:outline-none focus:border-blue-500"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <button 
                onClick={() => setAutoScroll(!autoScroll)}
                className={`p-1 rounded hover:bg-gray-700 ${autoScroll ? 'text-green-500' : 'text-gray-400'}`}
                title={autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
            >
                {autoScroll ? <ArrowDownCircle size={18} /> : <PauseCircle size={18} />}
            </button>
            <button
                onClick={() => setLogs([])}
                className="text-xs text-gray-400 hover:text-white hover:bg-gray-700 px-2 py-1 rounded"
            >
                Clear
            </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs md:text-sm text-gray-300 space-y-1 max-h-[500px] min-h-[300px]"
      >
        {filteredLogs.length === 0 ? (
            <div className="text-gray-600 italic text-center mt-10">No logs to display...</div>
        ) : (
            filteredLogs.map((entry, i) => (
            <div key={i} className="break-all hover:bg-gray-800/50 p-0.5 rounded">
                <span className="text-gray-500 select-none mr-2">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>
                <span>{entry.log}</span>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default LogTerminal;
