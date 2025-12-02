
import React, { useState, useMemo, useRef } from 'react';
import { Task, User, TaskStatus, TaskPriority, TaskType, FileRepositoryItem, TaskFrequency } from '../types';
import { enhanceTaskDescription } from '../services/geminiService';

// --- HELPER FUNCTIONS ---

const getProgress = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.TODO: return 5;
    case TaskStatus.IN_PROGRESS: return 50;
    case TaskStatus.REVIEW: return 80;
    case TaskStatus.DONE: return 100;
    default: return 0;
  }
};

const getProgressColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.TODO: return 'bg-slate-300';
    case TaskStatus.IN_PROGRESS: return 'bg-blue-500';
    case TaskStatus.REVIEW: return 'bg-purple-500';
    case TaskStatus.DONE: return 'bg-green-500';
    default: return 'bg-slate-300';
  }
};

const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.TODO:
       // Circle
       return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case TaskStatus.IN_PROGRESS:
       // Gears
       return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case TaskStatus.REVIEW:
       // Eye
       return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
    case TaskStatus.DONE:
       // Checkmark Circle
       return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    default:
       return null;
  }
};

// Simple Markdown Parser for Display
const renderMarkdown = (text: string) => {
  if (!text) return null;
  
  // Split by newlines to handle blocks
  return text.split('\n').map((line, index) => {
    // List Items
    if (line.trim().startsWith('- ')) {
       const content = line.trim().substring(2);
       return (
         <li key={index} className="ml-4 list-disc text-slate-700 dark:text-slate-300">
            {parseInlineStyles(content)}
         </li>
       );
    }
    // Standard paragraphs (handle empty lines as breaks)
    if (line.trim() === '') {
        return <br key={index} />;
    }
    return (
        <p key={index} className="mb-1 text-slate-700 dark:text-slate-300">
            {parseInlineStyles(line)}
        </p>
    );
  });
};

const parseInlineStyles = (text: string) => {
    // Very basic parser for **bold** and *italic*
    // Note: This is a simple implementation. For production, use a library like react-markdown.
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return part;
    });
};

// Reusable Dropdown Component for Consistent Look
const SelectWrapper = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative ${className}`}>
    {children}
    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500 dark:text-slate-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </div>
  </div>
);


// --- COMPONENTS ---

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, placeholder }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormat = (symbol: string, isBlock = false) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value;
    
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    let newText = '';
    let newCursorPos = 0;

    if (isBlock) {
        // For lists, ensure it starts on a new line if not at start
        const prefix = (start > 0 && text[start - 1] !== '\n') ? '\n' : '';
        newText = `${before}${prefix}${symbol} ${selection}${after}`;
        newCursorPos = start + prefix.length + symbol.length + 1 + selection.length;
    } else {
        // For inline (bold/italic)
        newText = `${before}${symbol}${selection}${symbol}${after}`;
        newCursorPos = end + (symbol.length * 2); 
        if (selection.length === 0) {
            newCursorPos = start + symbol.length;
        }
    }

    onChange(newText);
    
    // Need to wait for render to update cursor
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
    }, 0);
  };

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-brand-500 transition-all">
       <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          <button 
            type="button" 
            onClick={() => insertFormat('**')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
            title="Bold"
          >
             <strong className="font-serif">B</strong>
          </button>
          <button 
            type="button" 
            onClick={() => insertFormat('*')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
            title="Italic"
          >
             <em className="font-serif">I</em>
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
          <button 
            type="button" 
            onClick={() => insertFormat('-', true)}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
            title="Bullet List"
          >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
       </div>
       <textarea 
          ref={textareaRef}
          rows={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 bg-transparent border-none focus:ring-0 resize-none dark:text-white font-sans text-sm"
          placeholder={placeholder}
       ></textarea>
       <div className="px-2 py-1 bg-slate-50 dark:bg-slate-700/30 text-[10px] text-slate-400 text-right border-t border-slate-100 dark:border-slate-700">
          Markdown supported
       </div>
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  users: User[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onView: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, users, onEdit, onDelete, onStatusChange, onView }) => {
  const [isExiting, setIsExiting] = useState(false);
  
  const getAssigneeName = (id: string) => users.find(u => u.id === id)?.name || 'Unassigned';
  const getAssigneeAvatar = (id: string) => users.find(u => u.id === id)?.avatar;

  // Uses solid colors for dark mode to prevent transparency issues
  const statusColors = {
    [TaskStatus.TODO]: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600',
    [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800',
    [TaskStatus.REVIEW]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-800',
    [TaskStatus.DONE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800',
  };

  const priorityColors = {
    [TaskPriority.LOW]: 'text-slate-500',
    [TaskPriority.MEDIUM]: 'text-yellow-600',
    [TaskPriority.HIGH]: 'text-orange-600',
    [TaskPriority.CRITICAL]: 'text-red-600 font-bold',
  };

  const handleStatusChangeLocal = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    
    // If moving TO Done or FROM Done, we assume it will leave the current filtered view.
    // Trigger animation first, then update.
    if (newStatus === TaskStatus.DONE || task.status === TaskStatus.DONE) {
        setIsExiting(true);
        setTimeout(() => {
            onStatusChange(task.id, newStatus);
        }, 500); // Wait for animation
    } else {
        onStatusChange(task.id, newStatus);
    }
  };

  const progress = getProgress(task.status);
  const attachmentCount = task.fileIds?.length || 0;

  return (
    <div 
      onClick={() => onView(task)}
      className={`group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-brand-200 dark:hover:border-brand-900 transition-all duration-500 p-5 flex flex-col relative overflow-hidden cursor-pointer ${
         isExiting ? 'scale-90 opacity-0 translate-y-4' : 'scale-100 opacity-100'
      } ${task.status === TaskStatus.DONE && !isExiting ? 'ring-1 ring-green-500/20' : ''}`}
    >
      {/* Priority Indicator Line */}
      <div className={`absolute top-0 left-0 w-1 h-full ${task.priority === TaskPriority.CRITICAL ? 'bg-red-500' : task.priority === TaskPriority.HIGH ? 'bg-orange-400' : 'bg-transparent'}`}></div>

      <div className="flex justify-between items-start mb-3 pl-2">
         <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${task.type === TaskType.BAU ? 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-900/50 dark:text-indigo-300' : 'bg-pink-50 border-pink-100 text-pink-700 dark:bg-pink-900/20 dark:border-pink-900/50 dark:text-pink-300'}`}>
            {task.type} {task.frequency ? `• ${task.frequency}` : ''}
         </span>
         <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onEdit(task)} className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors" title="Edit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button onClick={() => onDelete(task.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Delete">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
         </div>
      </div>

      <div className="pl-2 flex-grow">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 leading-tight">{task.title}</h3>
      </div>
      
      <div className="pl-2 mt-auto pt-4">
         {/* Progress Bar */}
         <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Progress</span>
              <span className={`font-bold ${statusColors[task.status].split(' ')[1]}`}>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor(task.status)}`} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
         </div>

         <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center space-x-3">
               <div className="relative group/avatar cursor-help">
                  {getAssigneeAvatar(task.assigneeId) ? (
                    <img src={getAssigneeAvatar(task.assigneeId)} alt="" className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold border-2 border-white dark:border-slate-800">
                        {getAssigneeName(task.assigneeId).charAt(0)}
                    </div>
                  )}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    Assigned to: {getAssigneeName(task.assigneeId)}
                  </div>
               </div>
               
               <div className="flex flex-col">
                  <span className={`flex items-center text-xs font-bold ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs text-slate-400 flex items-center" title="Due Date & Time">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {task.dueTime && <span className="ml-1 text-slate-400">@ {task.dueTime}</span>}
                    </span>
                    {attachmentCount > 0 && (
                      <span className="text-xs text-slate-400 flex items-center" title={`${attachmentCount} attachments`}>
                         <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                         {attachmentCount}
                      </span>
                    )}
                  </div>
               </div>
            </div>

            <div onClick={(e) => e.stopPropagation()} className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-80 z-10">
                  {getStatusIcon(task.status)}
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60 z-10">
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              <select 
                value={task.status}
                onChange={handleStatusChangeLocal}
                className={`appearance-none text-xs font-bold py-1.5 pl-9 pr-7 rounded-lg cursor-pointer border ring-1 ring-inset focus:ring-2 outline-none transition-all ${statusColors[task.status]} ring-black/5 dark:ring-white/10`}
              >
                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
         </div>
      </div>
    </div>
  );
};

interface TaskListProps {
  tasks: Task[];
  users: User[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onView: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, users, onEdit, onDelete, onStatusChange, onView }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
      {tasks.length === 0 && (
         <div className="col-span-full text-center py-20 text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-200 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <p>No tasks match your filters.</p>
         </div>
      )}
      {tasks.map(task => (
        <TaskCard 
          key={task.id}
          task={task}
          users={users}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onView={onView}
        />
      ))}
    </div>
  );
};

// --- TASK VIEW CONTROLLER ---

interface TaskViewProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onCreateNew: () => void;
  onView: (task: Task) => void;
  showOnlyMyTasks?: boolean;
}

export const TaskView: React.FC<TaskViewProps> = (props) => {
  const [activeViewTab, setActiveViewTab] = useState<'ongoing' | 'completed'>('ongoing');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'dueDate' | 'createdAt' | 'priority'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Derived filtered tasks
  const filteredTasks = useMemo(() => {
    return props.tasks.filter(task => {
      // 1. Tab Logic: Ongoing vs Completed
      const matchesTab = activeViewTab === 'ongoing' 
         ? task.status !== TaskStatus.DONE 
         : task.status === TaskStatus.DONE;
      
      if (!matchesTab) return false;

      // 2. Search & Filters
      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
      const matchesType = typeFilter === 'All' || task.type === typeFilter;
      
      const effectiveAssigneeFilter = props.showOnlyMyTasks ? props.currentUser.id : assigneeFilter;
      const matchesAssignee = effectiveAssigneeFilter === 'All' || task.assigneeId === effectiveAssigneeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesAssignee;
    }).sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'priority': {
          const priorityOrder = { [TaskPriority.CRITICAL]: 0, [TaskPriority.HIGH]: 1, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [props.tasks, searchQuery, statusFilter, priorityFilter, typeFilter, assigneeFilter, sortBy, sortOrder, props.showOnlyMyTasks, props.currentUser.id, activeViewTab]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {props.showOnlyMyTasks ? 'My Tasks' : 'Task Board'}
          </h2>
          <button 
            onClick={props.onCreateNew}
            className="bg-brand-600 text-white px-5 py-2.5 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/30 flex items-center justify-center font-medium transition-transform active:scale-95"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Task
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-xl self-start">
           <button
             onClick={() => { setActiveViewTab('ongoing'); setStatusFilter('All'); }}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeViewTab === 'ongoing' 
                ? 'bg-white dark:bg-slate-600 text-brand-600 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
             }`}
           >
             Ongoing
           </button>
           <button
             onClick={() => { setActiveViewTab('completed'); setStatusFilter('All'); }}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeViewTab === 'completed' 
                ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
             }`}
           >
             Completed
           </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
           {/* Top Row: Search & Sort */}
           <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                 <input 
                    type="text" 
                    placeholder="Search tasks by title or description..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white"
                 />
                 <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              
              <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                  <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Sort by:</span>
                  <SelectWrapper>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="appearance-none px-3 py-2 pr-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                    >
                      <option value="dueDate">Due Date</option>
                      <option value="priority">Priority</option>
                      <option value="createdAt">Created Date</option>
                    </select>
                  </SelectWrapper>
                  <button 
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    title={sortOrder === 'asc' ? "Ascending" : "Descending"}
                  >
                     {sortOrder === 'asc' ? (
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                     ) : (
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h5m4 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                     )}
                  </button>
              </div>
           </div>
           
           {/* Bottom Row: Filters */}
           <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              <SelectWrapper className="min-w-[120px]">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none w-full px-3 py-2 pr-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                >
                  <option value="All">All Status</option>
                  {activeViewTab === 'ongoing' ? (
                      <>
                        <option value={TaskStatus.TODO}>{TaskStatus.TODO}</option>
                        <option value={TaskStatus.IN_PROGRESS}>{TaskStatus.IN_PROGRESS}</option>
                        <option value={TaskStatus.REVIEW}>{TaskStatus.REVIEW}</option>
                      </>
                  ) : (
                      <option value={TaskStatus.DONE}>{TaskStatus.DONE}</option>
                  )}
                </select>
              </SelectWrapper>

              <SelectWrapper className="min-w-[120px]">
                <select 
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="appearance-none w-full px-3 py-2 pr-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                >
                  <option value="All">All Priorities</option>
                  {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </SelectWrapper>

              <SelectWrapper className="min-w-[120px]">
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none w-full px-3 py-2 pr-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                >
                  <option value="All">All Types</option>
                  {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </SelectWrapper>

              {!props.showOnlyMyTasks && (
                <SelectWrapper className="min-w-[140px]">
                  <select 
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="appearance-none w-full px-3 py-2 pr-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                  >
                    <option value="All">All Assignees</option>
                    {props.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </SelectWrapper>
              )}
              
              <div className="flex-1 text-right text-sm text-slate-500 self-center hidden lg:block">
                 Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredTasks.length}</span> {activeViewTab} tasks
              </div>
           </div>
        </div>
      </div>

      <TaskList 
        tasks={filteredTasks} 
        users={props.users} 
        onEdit={props.onEdit} 
        onDelete={props.onDelete} 
        onStatusChange={props.onStatusChange}
        onView={props.onView}
      />
    </div>
  );
};

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  users: User[];
  availableFiles: FileRepositoryItem[];
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose, onEdit, users, availableFiles }) => {
  if (!isOpen || !task) return null;

  const assignee = users.find(u => u.id === task.assigneeId);
  const creator = users.find(u => u.id === task.creatorId);
  const taggedFiles = availableFiles.filter(f => task.fileIds?.includes(f.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur z-10 border-b border-slate-100 dark:border-slate-700 p-6 flex justify-between items-start">
           <div className="flex-1 mr-4">
             <div className="flex items-center space-x-3 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${task.type === TaskType.BAU ? 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' : 'bg-pink-50 border-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300'}`}>
                   {task.type} {task.frequency ? `• ${task.frequency}` : ''}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${getProgressColor(task.status)} text-white border-transparent`}>
                   {task.status}
                </span>
             </div>
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{task.title}</h2>
           </div>
           <div className="flex items-center space-x-2">
               <button 
                  onClick={() => { onClose(); onEdit(task); }}
                  className="flex items-center px-3 py-2 bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/40 rounded-lg text-sm font-medium transition-colors"
               >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Edit
               </button>
               <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
           </div>
        </div>
        
        <div className="p-6 space-y-8">
           {/* Main Description */}
           <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
              <div className="prose dark:prose-invert max-w-none">
                 {renderMarkdown(task.description)}
              </div>
           </div>

           {/* Metadata Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div>
                 <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</h3>
                 <p className={`font-bold ${
                    task.priority === TaskPriority.CRITICAL ? 'text-red-600' :
                    task.priority === TaskPriority.HIGH ? 'text-orange-500' :
                    task.priority === TaskPriority.MEDIUM ? 'text-yellow-600' : 'text-slate-500'
                 }`}>{task.priority}</p>
              </div>
              
              <div>
                 <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Due Date</h3>
                 <p className="font-medium text-slate-800 dark:text-slate-200">
                    {new Date(task.dueDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                    {task.dueTime && <span className="text-slate-500 ml-2">at {task.dueTime}</span>}
                 </p>
              </div>

              <div>
                 <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Assignee</h3>
                 <div className="flex items-center">
                    {assignee?.avatar ? (
                       <img src={assignee.avatar} alt="" className="w-6 h-6 rounded-full mr-2" />
                    ) : (
                       <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold mr-2 text-slate-600 dark:text-slate-300">
                          {assignee?.name.charAt(0) || '?'}
                       </div>
                    )}
                    <span className="font-medium text-slate-800 dark:text-slate-200">{assignee?.name || 'Unassigned'}</span>
                 </div>
              </div>

              <div>
                 <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Created By</h3>
                 <p className="text-sm text-slate-700 dark:text-slate-300">{creator?.name || 'Unknown'}</p>
                 <p className="text-xs text-slate-400">{new Date(task.createdAt).toLocaleDateString()}</p>
              </div>
           </div>

           {/* Attachments Section */}
           <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                 Attached Resources
              </h3>
              {taggedFiles.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {taggedFiles.map(file => (
                       <a 
                          key={file.id} 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-900 transition-all group"
                       >
                          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded mr-3 text-slate-500 group-hover:text-brand-500 transition-colors">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </div>
                          <div className="overflow-hidden">
                             <p className="font-medium text-slate-800 dark:text-white truncate text-sm">{file.name}</p>
                             <p className="text-xs text-slate-500">{file.type}</p>
                          </div>
                       </a>
                    ))}
                 </div>
              ) : (
                 <p className="text-sm text-slate-400 italic">No files attached to this task.</p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
  initialTask?: Task | null;
  users: User[];
  currentUser: User;
  availableFiles?: FileRepositoryItem[];
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, initialTask, users, currentUser, availableFiles = [] }) => {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [type, setType] = useState<TaskType>(initialTask?.type || TaskType.ADHOC);
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status || TaskStatus.TODO);
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || TaskPriority.MEDIUM);
  const [assigneeId, setAssigneeId] = useState(initialTask?.assigneeId || currentUser.id);
  const [dueDate, setDueDate] = useState(initialTask?.dueDate || new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState(initialTask?.dueTime || '');
  const [frequency, setFrequency] = useState<TaskFrequency>(initialTask?.frequency || TaskFrequency.WEEKLY);
  const [fileIds, setFileIds] = useState<string[]>(initialTask?.fileIds || []);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [fileSearch, setFileSearch] = useState('');

  React.useEffect(() => {
    if (isOpen) {
        if (initialTask) {
            setTitle(initialTask.title);
            setDescription(initialTask.description);
            setType(initialTask.type);
            setStatus(initialTask.status);
            setPriority(initialTask.priority);
            setAssigneeId(initialTask.assigneeId);
            setDueDate(initialTask.dueDate);
            setDueTime(initialTask.dueTime || '');
            setFrequency(initialTask.frequency || TaskFrequency.WEEKLY);
            setFileIds(initialTask.fileIds || []);
        } else {
            setTitle('');
            setDescription('');
            setType(TaskType.ADHOC);
            setStatus(TaskStatus.TODO);
            setPriority(TaskPriority.MEDIUM);
            setAssigneeId(currentUser.id);
            setDueDate(new Date().toISOString().split('T')[0]);
            setDueTime('');
            setFrequency(TaskFrequency.WEEKLY);
            setFileIds([]);
        }
        setFileSearch('');
    }
  }, [isOpen, initialTask, currentUser.id]);

  const handleAiEnhance = async () => {
    if (!title) return;
    setIsAiLoading(true);
    try {
      const result = await enhanceTaskDescription(title, type);
      setDescription(prev => `${result.description}\n\n**Suggested Subtasks:**\n${result.subtasks.map(s => `- ${s}`).join('\n')}`);
      const p = Object.values(TaskPriority).find(v => v.toLowerCase() === result.priority.toLowerCase());
      if (p) setPriority(p);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleToggleFile = (id: string) => {
    setFileIds(prev => prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialTask?.id,
      title,
      description,
      type,
      status,
      priority,
      assigneeId,
      creatorId: initialTask?.creatorId || currentUser.id,
      dueDate,
      dueTime,
      frequency: type === TaskType.BAU ? frequency : undefined,
      fileIds
    });
    onClose();
  };

  const filteredFiles = availableFiles.filter(f => 
    f.name.toLowerCase().includes(fileSearch.toLowerCase()) || 
    f.type.toLowerCase().includes(fileSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-xl font-bold dark:text-white">{initialTask ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Title</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  required
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="e.g. Generate Weekly Sales Report"
                />
                <button 
                  type="button" 
                  onClick={handleAiEnhance}
                  disabled={isAiLoading || !title}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 whitespace-nowrap flex items-center"
                >
                  {isAiLoading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      AI Assist
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Type</label>
              <SelectWrapper>
                <select value={type} onChange={e => setType(e.target.value as TaskType)} className="appearance-none w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </SelectWrapper>
            </div>

            {type === TaskType.BAU && (
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Frequency</label>
                <SelectWrapper>
                  <select 
                    value={frequency} 
                    onChange={e => setFrequency(e.target.value as TaskFrequency)} 
                    className="appearance-none w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    {Object.values(TaskFrequency).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </SelectWrapper>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Description</label>
              <MarkdownEditor 
                 value={description}
                 onChange={setDescription}
                 placeholder="Task details (Supports **bold**, *italic*, and - lists)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Status</label>
              <SelectWrapper>
                <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} className="appearance-none w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </SelectWrapper>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Priority</label>
              <SelectWrapper>
                <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className="appearance-none w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </SelectWrapper>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Assignee</label>
              <SelectWrapper>
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="appearance-none w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </SelectWrapper>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Due Date</label>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={e => setDueDate(e.target.value)} 
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Time</label>
                <input 
                  type="time" 
                  value={dueTime} 
                  onChange={e => setDueTime(e.target.value)} 
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
            </div>

            {/* ATTACHMENTS SECTION */}
            <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-700">
               <div className="flex justify-between items-center mb-3">
                 <label className="block text-sm font-medium dark:text-slate-300">Attachments from Repository</label>
                 <div className="relative w-1/2">
                    <input 
                       type="text" 
                       placeholder="Search files..." 
                       value={fileSearch}
                       onChange={(e) => setFileSearch(e.target.value)}
                       className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-1 focus:ring-brand-500"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
               </div>
               
               {availableFiles.length === 0 ? (
                 <p className="text-sm text-slate-400 italic">No files available in the repository. Add some in the "Repository" tab.</p>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                   {filteredFiles.length === 0 && <p className="text-xs text-slate-500 col-span-2 text-center py-4">No matching files found.</p>}
                   {filteredFiles.map(file => (
                     <div 
                        key={file.id} 
                        onClick={() => handleToggleFile(file.id)}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                          fileIds.includes(file.id) 
                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 dark:bg-blue-900/20 dark:border-blue-500' 
                            : 'bg-slate-50 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                     >
                       <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${
                          fileIds.includes(file.id) ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'
                       }`}>
                          {fileIds.includes(file.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                       </div>
                       <div className="overflow-hidden">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                          <p className="text-xs text-slate-500 truncate">{file.type}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-6 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg shadow-lg shadow-brand-500/30">Save Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};
