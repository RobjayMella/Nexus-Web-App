
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { TaskView, TaskModal, TaskDetailModal } from './components/TaskComponents';
import { AiTools } from './components/AiTools';
import { SystemDocs } from './components/SystemDocs';
import { Auth } from './components/Auth';
import { FileRepository } from './components/FileRepository';
import { LeaveTracker } from './components/LeaveTracker';
import { Task, User, ActivityLog, TaskStatus, TaskPriority, TaskType, Notification, FileRepositoryItem, LeaveRecord, TaskFrequency } from './types';
import { generateDailyStandup } from './services/geminiService';

// --- MOCK DATA FOR INITIAL LOAD ---
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice Chen', email: 'alice@nexus.com', role: 'Senior Analyst', themePreference: 'system' },
  { id: 'u2', name: 'Bob Smith', email: 'bob@nexus.com', role: 'Junior Analyst', themePreference: 'light' },
  { id: 'u3', name: 'Charlie Kim', email: 'charlie@nexus.com', role: 'Product Owner', themePreference: 'dark' },
];

const INITIAL_FILES: FileRepositoryItem[] = [
  { id: 'f1', name: 'Weekly Sales Dashboard', url: 'https://datastudio.google.com/reporting/sales', type: 'Dashboard', uploadedBy: 'u3', createdAt: new Date().toISOString() },
  { id: 'f2', name: 'Q3 Market Analysis', url: 'https://docs.google.com/document/d/market-q3', type: 'Report', uploadedBy: 'u1', createdAt: new Date().toISOString() }
];

const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Weekly KPI Report',
    description: 'Compile the sales and engagement metrics for the weekly stakeholder meeting.',
    type: TaskType.BAU,
    frequency: TaskFrequency.WEEKLY,
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    assigneeId: 'u1',
    creatorId: 'u3',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dueTime: '10:00',
    createdAt: new Date().toISOString(),
    fileIds: ['f1']
  },
  {
    id: 't2',
    title: 'Competitor Analysis - Project X',
    description: 'Deep dive into feature set of main competitor for the new checkout flow.',
    type: TaskType.ADHOC,
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    assigneeId: 'u1',
    creatorId: 'u1',
    dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    dueTime: '17:00',
    createdAt: new Date().toISOString()
  }
];

// --- EXTRACTED SUB-COMPONENTS TO PREVENT RE-RENDERS ---

const Dashboard: React.FC<{ 
  currentUser: User, 
  tasks: Task[], 
  logs: ActivityLog[], 
  users: User[], 
  standupReport: string, 
  loadingStandup: boolean, 
  onGenerateStandup: () => void 
}> = ({ currentUser, tasks, logs, users, standupReport, loadingStandup, onGenerateStandup }) => {
    const myTasks = tasks.filter(t => t.assigneeId === currentUser.id);
    const pending = myTasks.filter(t => t.status !== TaskStatus.DONE).length;
    const bauCount = myTasks.filter(t => t.type === TaskType.BAU).length;
    const completed = myTasks.filter(t => t.status === TaskStatus.DONE).length;
    
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
              <h3 className="text-blue-100 font-medium">Pending Tasks</h3>
              <p className="text-4xl font-bold mt-2">{pending}</p>
           </div>
           <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
              <h3 className="text-indigo-100 font-medium">BAU Workload</h3>
              <p className="text-4xl font-bold mt-2">{bauCount}</p>
           </div>
           <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
              <h3 className="text-green-100 font-medium">Completed</h3>
              <p className="text-4xl font-bold mt-2">{completed}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">AI Standup Generator</h3>
                 <button 
                   onClick={onGenerateStandup} 
                   disabled={loadingStandup}
                   className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 disabled:opacity-50"
                 >
                   {loadingStandup ? 'Generating...' : 'Generate Report'}
                 </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg min-h-[150px] text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                 {standupReport || "Click 'Generate Report' to create a summary of your recent activities using Gemini AI."}
              </div>
           </div>

           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Recent Activity</h3>
              <ul className="space-y-4">
                 {logs.slice(0, 5).map(log => (
                   <li key={log.id} className="flex items-start text-sm">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-slate-300 mr-3 flex-shrink-0"></div>
                      <div>
                         <p className="font-medium text-slate-900 dark:text-slate-100">
                            {users.find(u => u.id === log.userId)?.name} <span className="text-slate-500 font-normal">{log.action}</span>
                         </p>
                         <p className="text-slate-500 dark:text-slate-400 text-xs">{log.details}</p>
                         <p className="text-slate-400 text-xs mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                   </li>
                 ))}
              </ul>
           </div>
        </div>
      </div>
    );
};

const ActivityView: React.FC<{ logs: ActivityLog[], users: User[] }> = ({ logs, users }) => (
    <div className="space-y-4 animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Audit Log</h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-700">
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 uppercase font-medium">
                   <tr>
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Action</th>
                      <th className="px-6 py-3">Details</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                   {logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                         <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                         <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{users.find(u => u.id === log.userId)?.name}</td>
                         <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-200">
                              {log.action}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{log.details}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>
    </div>
);

const ProfileView: React.FC<{ 
  currentUser: User, 
  users: User[], 
  onUpdateProfile: (u: Partial<User>) => void,
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
  onSwitchUser: (u: User) => void
}> = ({ currentUser, users, onUpdateProfile, onFileUpload, onSwitchUser }) => {
    
    // Use local state to prevent expensive global updates (and notifications) on every keystroke
    const [localName, setLocalName] = useState(currentUser.name);

    useEffect(() => {
        setLocalName(currentUser.name);
    }, [currentUser.name]);

    const handleNameBlur = () => {
        if (localName !== currentUser.name) {
            onUpdateProfile({ name: localName });
        }
    };

    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8 animate-fade-in border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-8 text-slate-800 dark:text-white">Profile Settings</h2>
        
        <div className="flex items-center space-x-6 mb-8">
           <div className="relative">
              {currentUser.avatar ? (
                 <img src={currentUser.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-700" />
              ) : (
                 <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-3xl font-bold">
                    {currentUser.name.charAt(0)}
                 </div>
              )}
              <label className="absolute bottom-0 right-0 bg-white dark:bg-slate-700 p-2 rounded-full shadow-md cursor-pointer hover:bg-slate-50 border border-slate-200 dark:border-slate-600">
                 <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 <input type="file" className="hidden" accept="image/*" onChange={onFileUpload} />
              </label>
           </div>
           <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{currentUser.name}</h3>
              <p className="text-slate-500">{currentUser.email}</p>
              <p className="text-slate-400 text-sm mt-1">{currentUser.role}</p>
           </div>
        </div>

        <div className="space-y-6">
           <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Display Name</label>
              <input 
                 type="text" 
                 value={localName} 
                 onChange={e => setLocalName(e.target.value)}
                 onBlur={handleNameBlur}
                 className="w-full px-4 py-2 border rounded-lg bg-transparent dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500" 
              />
           </div>
           
           <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Theme Preference</label>
              <div className="grid grid-cols-3 gap-3">
                 {(['light', 'dark', 'system'] as const).map(theme => (
                    <button
                       key={theme}
                       onClick={() => onUpdateProfile({ themePreference: theme })}
                       className={`py-2 px-4 rounded-lg border text-sm font-medium capitalize transition-all ${
                          currentUser.themePreference === theme
                          ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                       }`}
                    >
                       {theme}
                    </button>
                 ))}
              </div>
           </div>
           
           <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
             <h4 className="text-sm font-medium mb-3 text-slate-500 uppercase tracking-wide">Developer Tools</h4>
             <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Simulate User Switch</label>
             <div className="relative">
                <select 
                className="appearance-none w-full px-4 py-2 border rounded-lg bg-transparent dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                value={currentUser.id}
                onChange={(e) => {
                    const user = users.find(u => u.id === e.target.value);
                    if (user) onSwitchUser(user);
                }}
                >
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500 dark:text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
             </div>
           </div>
        </div>
      </div>
    );
};


const App: React.FC = () => {
  // --- STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [files, setFiles] = useState<FileRepositoryItem[]>(INITIAL_FILES);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [standupReport, setStandupReport] = useState<string>('');
  const [loadingStandup, setLoadingStandup] = useState(false);

  // --- PERSISTENCE & INIT ---
  useEffect(() => {
    const savedTasks = localStorage.getItem('nexus_tasks');
    const savedLogs = localStorage.getItem('nexus_logs');
    const savedUsers = localStorage.getItem('nexus_users');
    const savedFiles = localStorage.getItem('nexus_files');
    const savedLeaves = localStorage.getItem('nexus_leaves');
    const savedSession = localStorage.getItem('nexus_currentUser');
    
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedFiles) setFiles(JSON.parse(savedFiles));
    if (savedLeaves) setLeaves(JSON.parse(savedLeaves));
    
    if (savedSession) {
      setCurrentUser(JSON.parse(savedSession));
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('nexus_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('nexus_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('nexus_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('nexus_leaves', JSON.stringify(leaves));
  }, [leaves]);

  // --- THEME HANDLING ---
  useEffect(() => {
    if (!currentUser) return;
    const root = window.document.documentElement;
    if (currentUser.themePreference === 'dark' || (currentUser.themePreference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [currentUser]);

  // --- HELPERS ---
  const addLog = (userId: string, action: string, details: string, entityId?: string) => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      entityId
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const addNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      message,
      type,
      read: false,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const getNextRecurringDate = (currentDateStr: string, frequency: TaskFrequency): string => {
    const date = new Date(currentDateStr);
    switch (frequency) {
      case TaskFrequency.DAILY:
        date.setDate(date.getDate() + 1);
        break;
      case TaskFrequency.WEEKLY:
        date.setDate(date.getDate() + 7);
        break;
      case TaskFrequency.BIWEEKLY:
        date.setDate(date.getDate() + 14);
        break;
      case TaskFrequency.MONTHLY:
        date.setMonth(date.getMonth() + 1);
        break;
      case TaskFrequency.QUARTERLY:
        date.setMonth(date.getMonth() + 3);
        break;
      default:
        break;
    }
    return date.toISOString().split('T')[0];
  };

  // --- AUTH ACTIONS ---
  const handleLogin = (name: string, email: string) => {
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      setCurrentUser(existingUser);
      localStorage.setItem('nexus_currentUser', JSON.stringify(existingUser));
      setIsAuthenticated(true);
      addLog(existingUser.id, 'Login', 'User logged in with Google');
      addNotification(`Welcome back, ${existingUser.name}!`, 'success');
    } else {
      // Create new user profile
      const newUser: User = {
        id: Date.now().toString(),
        name: name || email.split('@')[0], // Fallback if name not provided
        email: email,
        role: 'Analyst',
        themePreference: 'system'
      };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      setCurrentUser(newUser);
      localStorage.setItem('nexus_users', JSON.stringify(updatedUsers));
      localStorage.setItem('nexus_currentUser', JSON.stringify(newUser));
      setIsAuthenticated(true);
      addLog(newUser.id, 'Register', 'New user registered via Google');
      addNotification(`Welcome to Nexus, ${newUser.name}!`, 'success');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_currentUser');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // --- TASK ACTIONS ---
  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
    if (!currentUser) return;

    if (taskData.id) {
      // Edit
      setTasks(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData } : t));
      addLog(currentUser.id, 'Update Task', `Updated task: ${taskData.title}`, taskData.id);
      addNotification(`Task "${taskData.title}" updated.`);
    } else {
      // Create
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setTasks(prev => [newTask, ...prev]);
      addLog(currentUser.id, 'Create Task', `Created task: ${newTask.title}`, newTask.id);
      addNotification(`Task "${newTask.title}" created successfully.`, 'success');
    }
  };

  const handleDeleteTask = (id: string) => {
    if (!currentUser) return;
    const task = tasks.find(t => t.id === id);
    if (confirm(`Are you sure you want to delete "${task?.title}"?`)) {
      setTasks(prev => prev.filter(t => t.id !== id));
      addLog(currentUser.id, 'Delete Task', `Deleted task: ${task?.title}`, id);
      addNotification('Task deleted.');
    }
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    if (!currentUser) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    let updatedTasks = tasks.map(t => t.id === id ? { ...t, status } : t);

    // Handle Recurring Logic
    if (task.type === TaskType.BAU && task.frequency && status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
       // Logic: When moving TO done, create the next task.
       const nextDate = getNextRecurringDate(task.dueDate, task.frequency);
       
       // Check if a task already exists for this date (simple check to avoid duplicates from Leave Tracker creation)
       const duplicateExists = tasks.some(t => 
          t.title === task.title && 
          t.dueDate === nextDate && 
          t.type === TaskType.BAU
       );

       if (!duplicateExists) {
          const nextTask: Task = {
             ...task,
             id: Date.now().toString(),
             status: TaskStatus.TODO,
             dueDate: nextDate,
             createdAt: new Date().toISOString()
          };
          
          updatedTasks = [nextTask, ...updatedTasks];
          addLog(currentUser.id, 'Recurring Task', `Generated next occurrence of "${task.title}" for ${nextDate}`, nextTask.id);
          addNotification(`Recurring task created for ${new Date(nextDate).toLocaleDateString()}.`, 'info');
       }
    }

    setTasks(updatedTasks);
    addLog(currentUser.id, 'Move Task', `Moved task "${task.title}" to ${status}`, id);
  };

  // --- FILE REPOSITORY ACTIONS ---
  const handleAddFile = (fileData: Omit<FileRepositoryItem, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    const newFile: FileRepositoryItem = {
      ...fileData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setFiles(prev => [...prev, newFile]);
    addLog(currentUser.id, 'Upload File', `Added file/link: ${newFile.name}`, newFile.id);
    addNotification('Resource added to repository.', 'success');
  };

  const handleEditFile = (file: FileRepositoryItem) => {
    if (!currentUser) return;
    setFiles(prev => prev.map(f => f.id === file.id ? file : f));
    addLog(currentUser.id, 'Update File', `Updated file/link: ${file.name}`, file.id);
    addNotification('Resource updated.', 'success');
  };

  const handleDeleteFile = (id: string) => {
    if (!currentUser) return;
    if(confirm("Delete this file from repository?")) {
      setFiles(prev => prev.filter(f => f.id !== id));
      // Also remove reference from tasks
      setTasks(prev => prev.map(t => ({...t, fileIds: t.fileIds?.filter(fid => fid !== id)})));
      addLog(currentUser.id, 'Delete File', 'Removed file from repository', id);
    }
  };

  // --- LEAVE ACTIONS ---
  const handleAddLeave = (
     leaveData: Omit<LeaveRecord, 'id'>, 
     taskReassignments: { taskId: string, assigneeId: string }[],
     tasksToCreate: { sourceTaskId: string, dueDate: string, assigneeId: string }[]
  ) => {
    if (!currentUser) return;
    
    // 1. Create Leave Record
    const newLeave: LeaveRecord = {
      ...leaveData,
      id: Date.now().toString()
    };
    setLeaves(prev => [newLeave, ...prev]);
    addLog(currentUser.id, 'Leave Scheduled', `Scheduled ${newLeave.type} from ${newLeave.startDate} to ${newLeave.endDate}`, newLeave.id);
    
    let updatedTasks = [...tasks];
    let createdCount = 0;

    // 2. Process Task Reassignments (Existing Tasks)
    if (taskReassignments.length > 0) {
       updatedTasks = updatedTasks.map(task => {
          const reassignment = taskReassignments.find(r => r.taskId === task.id);
          if (reassignment) {
             const newAssignee = users.find(u => u.id === reassignment.assigneeId)?.name || 'Unknown';
             addLog(currentUser.id, 'Task Reassigned', `Reassigned "${task.title}" to ${newAssignee} due to leave.`, task.id);
             return { ...task, assigneeId: reassignment.assigneeId };
          }
          return task;
       });
    }

    // 3. Process Future Task Creation
    if (tasksToCreate.length > 0) {
       tasksToCreate.forEach(creation => {
          const sourceTask = tasks.find(t => t.id === creation.sourceTaskId);
          if (sourceTask) {
             const newAssignee = users.find(u => u.id === creation.assigneeId)?.name || 'Unknown';
             const newTask: Task = {
                ...sourceTask,
                id: Date.now().toString() + Math.floor(Math.random() * 1000), // Ensure unique ID
                dueDate: creation.dueDate,
                assigneeId: creation.assigneeId,
                status: TaskStatus.TODO,
                createdAt: new Date().toISOString()
             };
             updatedTasks = [newTask, ...updatedTasks];
             createdCount++;
             addLog(currentUser.id, 'Task Created', `Created future task "${newTask.title}" for coverage by ${newAssignee}.`, newTask.id);
          }
       });
    }

    setTasks(updatedTasks);
    
    const totalChanges = taskReassignments.length + createdCount;
    if (totalChanges > 0) {
       addNotification(`Leave booked. ${totalChanges} tasks reassigned/created for coverage.`, 'success');
    } else {
       addNotification('Leave booked successfully.', 'success');
    }
  };

  const handleEditLeave = (
     updatedLeave: LeaveRecord, 
     taskReassignments: { taskId: string, assigneeId: string }[],
     tasksToCreate: { sourceTaskId: string, dueDate: string, assigneeId: string }[]
  ) => {
    if (!currentUser) return;
    
    // 1. Update Leave Record
    setLeaves(prev => prev.map(l => l.id === updatedLeave.id ? updatedLeave : l));
    addLog(currentUser.id, 'Leave Updated', `Updated leave ${updatedLeave.id}`, updatedLeave.id);
    
    let updatedTasks = [...tasks];
    let createdCount = 0;

    // 2. Process Task Reassignments
    if (taskReassignments.length > 0) {
       updatedTasks = updatedTasks.map(task => {
          const reassignment = taskReassignments.find(r => r.taskId === task.id);
          if (reassignment) {
             const newAssignee = users.find(u => u.id === reassignment.assigneeId)?.name || 'Unknown';
             addLog(currentUser.id, 'Task Reassigned', `Reassigned "${task.title}" to ${newAssignee} due to leave update.`, task.id);
             return { ...task, assigneeId: reassignment.assigneeId };
          }
          return task;
       });
    }

    // 3. Process Future Task Creation
    if (tasksToCreate.length > 0) {
       tasksToCreate.forEach(creation => {
          const sourceTask = tasks.find(t => t.id === creation.sourceTaskId);
          if (sourceTask) {
             const newAssignee = users.find(u => u.id === creation.assigneeId)?.name || 'Unknown';
             const newTask: Task = {
                ...sourceTask,
                id: Date.now().toString() + Math.floor(Math.random() * 1000),
                dueDate: creation.dueDate,
                assigneeId: creation.assigneeId,
                status: TaskStatus.TODO,
                createdAt: new Date().toISOString()
             };
             updatedTasks = [newTask, ...updatedTasks];
             createdCount++;
             addLog(currentUser.id, 'Task Created', `Created future task "${newTask.title}" for coverage by ${newAssignee}.`, newTask.id);
          }
       });
    }

    setTasks(updatedTasks);

    const totalChanges = taskReassignments.length + createdCount;
    if (totalChanges > 0) {
       addNotification(`Leave updated. ${totalChanges} tasks reassigned/created.`, 'success');
    } else {
       addNotification('Leave updated successfully.', 'success');
    }
  };

  const handleDeleteLeave = (id: string) => {
    if (!currentUser) return;
    if (confirm("Are you sure you want to cancel this leave request?")) {
        setLeaves(prev => prev.filter(l => l.id !== id));
        addLog(currentUser.id, 'Leave Cancelled', `Cancelled leave request`, id);
        addNotification('Leave request cancelled.', 'info');
    }
  };

  // --- OTHER ACTIONS ---
  const handleGenerateStandup = async () => {
    if (!currentUser) return;
    setLoadingStandup(true);
    const userLogs = logs.filter(l => l.userId === currentUser.id);
    const report = await generateDailyStandup(userLogs, currentUser.name);
    setStandupReport(report);
    setLoadingStandup(false);
  };

  const handleProfileUpdate = (updatedUser: Partial<User>) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...updatedUser } : u));
    const newUser = { ...currentUser, ...updatedUser };
    setCurrentUser(newUser);
    localStorage.setItem('nexus_currentUser', JSON.stringify(newUser)); // Update session
    addLog(currentUser.id, 'Update Profile', 'Updated profile settings');
    addNotification('Profile updated.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleProfileUpdate({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    addLog(user.id, 'Login', `Switched to user ${user.name}`);
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} users={users} />;
  }

  return (
    <Layout 
      currentUser={currentUser} 
      notifications={notifications} 
      activeTab={activeTab} 
      onNavigate={setActiveTab}
      onClearNotifications={() => setNotifications(prev => prev.map(n => ({...n, read: true})))}
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && currentUser && (
        <Dashboard 
          currentUser={currentUser}
          tasks={tasks}
          logs={logs}
          users={users}
          standupReport={standupReport}
          loadingStandup={loadingStandup}
          onGenerateStandup={handleGenerateStandup}
        />
      )}
      {activeTab === 'my-tasks' && currentUser && (
        <TaskView 
          tasks={tasks} 
          users={users}
          currentUser={currentUser}
          onEdit={(task) => {
             setEditingTask(task);
             setTaskModalOpen(true);
          }}
          onDelete={handleDeleteTask}
          onStatusChange={handleStatusChange}
          onCreateNew={() => {
            setEditingTask(null);
            setTaskModalOpen(true);
          }}
          onView={(task) => setViewingTask(task)}
          showOnlyMyTasks={true}
        />
      )}
      {activeTab === 'tasks' && currentUser && (
        <TaskView 
          tasks={tasks} 
          users={users}
          currentUser={currentUser}
          onEdit={(task) => {
             setEditingTask(task);
             setTaskModalOpen(true);
          }}
          onDelete={handleDeleteTask}
          onStatusChange={handleStatusChange}
          onCreateNew={() => {
            setEditingTask(null);
            setTaskModalOpen(true);
          }}
          onView={(task) => setViewingTask(task)}
        />
      )}
      {activeTab === 'repository' && currentUser && (
        <FileRepository 
           files={files}
           users={users}
           currentUser={currentUser}
           onAddFile={handleAddFile}
           onEditFile={handleEditFile}
           onDeleteFile={handleDeleteFile}
        />
      )}
      {activeTab === 'leave-tracker' && currentUser && (
        <LeaveTracker 
           leaves={leaves}
           users={users}
           currentUser={currentUser}
           tasks={tasks}
           onAddLeave={handleAddLeave}
           onEditLeave={handleEditLeave}
           onDeleteLeave={handleDeleteLeave}
        />
      )}
      {activeTab === 'ai-studio' && <AiTools />}
      {activeTab === 'activity' && <ActivityView logs={logs} users={users} />}
      {activeTab === 'profile' && currentUser && (
         <ProfileView 
            currentUser={currentUser}
            users={users}
            onUpdateProfile={handleProfileUpdate}
            onFileUpload={handleFileUpload}
            onSwitchUser={handleSwitchUser}
         />
      )}
      {activeTab === 'docs' && <SystemDocs />}

      {currentUser && (
        <>
          <TaskModal 
            isOpen={isTaskModalOpen} 
            onClose={() => setTaskModalOpen(false)} 
            onSave={handleSaveTask}
            initialTask={editingTask}
            users={users}
            currentUser={currentUser}
            availableFiles={files}
          />
          <TaskDetailModal 
            isOpen={!!viewingTask}
            onClose={() => setViewingTask(null)}
            task={viewingTask}
            onEdit={(task) => {
               setEditingTask(task);
               setTaskModalOpen(true);
            }}
            users={users}
            availableFiles={files}
          />
        </>
      )}
    </Layout>
  );
};

export default App;
