
import React, { useState, useMemo, useEffect } from 'react';
import { LeaveRecord, LeaveType, User, Task, TaskStatus, TaskFrequency, TaskType } from '../types';

interface LeaveTrackerProps {
  leaves: LeaveRecord[];
  users: User[];
  currentUser: User;
  tasks: Task[];
  onAddLeave: (
    leave: Omit<LeaveRecord, 'id'>, 
    taskReassignments: { taskId: string, assigneeId: string }[],
    tasksToCreate: { sourceTaskId: string, dueDate: string, assigneeId: string }[]
  ) => void;
  onEditLeave: (
    leave: LeaveRecord, 
    taskReassignments: { taskId: string, assigneeId: string }[],
    tasksToCreate: { sourceTaskId: string, dueDate: string, assigneeId: string }[]
  ) => void;
  onDeleteLeave: (id: string) => void;
}

// Helper to project dates
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

export const LeaveTracker: React.FC<LeaveTrackerProps> = ({ leaves, users, currentUser, tasks, onAddLeave, onEditLeave, onDeleteLeave }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRecord | null>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.VACATION);
  const [reason, setReason] = useState('');
  const [reassignments, setReassignments] = useState<{ [key: string]: string }>({});

  // Sort leaves by start date descending
  const userLeaves = useMemo(() => {
    return leaves
      .filter(l => l.userId === currentUser.id)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [leaves, currentUser.id]);

  // Find tasks that fall within the selected leave range
  // CRITICAL: This memo must depend on startDate and endDate state variables
  const conflictingTasks = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    
    // Normalize time for fair comparison
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    const conflicts: (Task & { isVirtual?: boolean, sourceTaskId?: string })[] = [];

    // 1. Check Existing Tasks
    tasks.forEach((task: Task) => {
      // Only check tasks assigned to current user that are not done
      if (task.assigneeId !== currentUser.id || task.status === TaskStatus.DONE) return;
      
      const due = new Date(task.dueDate);
      due.setHours(12,0,0,0); // Avoid timezone edges
      
      if (due >= start && due <= end) {
        conflicts.push(task);
      }

      // 2. Check Future Recurring Tasks (BAU)
      if (task.type === TaskType.BAU && task.frequency) {
         let nextDate = getNextRecurringDate(task.dueDate, task.frequency);
         let projectionCount = 0;
         
         // Project up to 1 year ahead or max 50 instances
         while (projectionCount < 50) {
            const nextDue = new Date(nextDate);
            nextDue.setHours(12,0,0,0);

            if (nextDue > end) break; // Passed the leave window

            if (nextDue >= start) {
               // This future date falls in the leave window
               const virtualTask: Task & { isVirtual?: boolean; sourceTaskId?: string } = {
                  ...task,
                  id: `virtual_${String(task.id)}_${nextDate}`,
                  dueDate: nextDate,
                  title: task.title, // Title is reused, we add visual indicator in UI
                  isVirtual: true,
                  sourceTaskId: String(task.id)
               };
               conflicts.push(virtualTask);
            }

            nextDate = getNextRecurringDate(nextDate, task.frequency);
            projectionCount++;
         }
      }
    });

    return conflicts.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [startDate, endDate, tasks, currentUser.id]);

  // Reset reassignments when date changes to avoid stale keys
  useEffect(() => {
     setReassignments({});
  }, [startDate, endDate]);

  const handleOpenAdd = () => {
    setEditingLeave(null);
    setStartDate('');
    setEndDate('');
    setLeaveType(LeaveType.VACATION);
    setReason('');
    setReassignments({});
    setModalOpen(true);
  };

  const handleOpenEdit = (leave: LeaveRecord) => {
    setEditingLeave(leave);
    setStartDate(leave.startDate);
    setEndDate(leave.endDate);
    setLeaveType(leave.type);
    setReason(leave.reason);
    setReassignments({});
    setModalOpen(true);
  };

  const handleReassignmentChange = (taskId: string, userId: string) => {
    setReassignments(prev => ({
      ...prev,
      [taskId]: userId
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tasksToUpdate: { taskId: string, assigneeId: string }[] = [];
    const tasksToCreate: { sourceTaskId: string, dueDate: string, assigneeId: string }[] = [];

    Object.entries(reassignments).forEach(([taskId, assigneeId]) => {
       const safeTaskId = taskId as string;
       const safeAssigneeId = assigneeId as string;

       if (safeAssigneeId === currentUser.id) return; // Skip if assigning to self

       if (safeTaskId.startsWith('virtual_')) {
          const dateStr = safeTaskId.substring(safeTaskId.lastIndexOf('_') + 1);
          const srcId = safeTaskId.substring(safeTaskId.indexOf('_') + 1, safeTaskId.lastIndexOf('_'));
          
          tasksToCreate.push({
             sourceTaskId: srcId,
             dueDate: dateStr,
             assigneeId: safeAssigneeId
          });
       } else {
          tasksToUpdate.push({ taskId: safeTaskId, assigneeId: safeAssigneeId });
       }
    });

    if (editingLeave) {
        onEditLeave({
            ...editingLeave,
            startDate,
            endDate,
            type: leaveType,
            reason
        }, tasksToUpdate, tasksToCreate);
    } else {
        onAddLeave({
            userId: currentUser.id,
            startDate,
            endDate,
            type: leaveType,
            reason,
            status: 'Approved' // Auto-approve for demo
        }, tasksToUpdate, tasksToCreate);
    }

    setModalOpen(false);
    setStartDate('');
    setEndDate('');
    setReason('');
    setReassignments({});
    setEditingLeave(null);
  };

  const getDuration = (start: string, end: string) => {
     const d1 = new Date(start);
     const d2 = new Date(end);
     const diffTime = Math.abs(d2.getTime() - d1.getTime());
     return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Leave Tracker</h2>
           <p className="text-slate-500 dark:text-slate-400">Manage your time off and cover for tasks.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/30 flex items-center justify-center font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Plan Leave
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Your Leave History</h3>
           {userLeaves.length === 0 ? (
             <p className="text-slate-400 italic">No leave records found.</p>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 uppercase font-medium">
                     <tr>
                        <th className="px-6 py-3 rounded-l-lg">Type</th>
                        <th className="px-6 py-3">Dates</th>
                        <th className="px-6 py-3">Duration</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Reason</th>
                        <th className="px-6 py-3 rounded-r-lg">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                     {userLeaves.map(leave => (
                          <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                             <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                   leave.type === LeaveType.VACATION ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                   leave.type === LeaveType.SICK ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                }`}>
                                  {leave.type}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                                {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                             </td>
                             <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                                {getDuration(leave.startDate, leave.endDate)} days
                             </td>
                             <td className="px-6 py-4">
                                <span className={`flex items-center font-bold text-xs ${
                                    leave.status === 'Approved' 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-yellow-600 dark:text-yellow-400'
                                }`}>
                                   {leave.status === 'Approved' ? (
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                   ) : (
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                   )}
                                   {leave.status}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-slate-500 truncate max-w-xs" title={leave.reason}>
                                {leave.reason || '-'}
                             </td>
                             <td className="px-6 py-4 flex space-x-2">
                               <button 
                                 onClick={() => handleOpenEdit(leave)}
                                 className="text-slate-400 hover:text-brand-500 transition-colors p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                 title="Edit"
                               >
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                               </button>
                               <button 
                                 onClick={() => onDeleteLeave(leave.id)}
                                 className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                 title="Cancel Leave"
                               >
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                               </button>
                             </td>
                          </tr>
                     ))}
                  </tbody>
               </table>
             </div>
           )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                 <h2 className="text-xl font-bold dark:text-white">{editingLeave ? 'Edit Leave Request' : 'Plan Leave'}</h2>
                 <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium mb-1 dark:text-slate-300">Start Date</label>
                       <input 
                         type="date" 
                         required
                         value={startDate}
                         onChange={e => setStartDate(e.target.value)}
                         className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium mb-1 dark:text-slate-300">End Date</label>
                       <input 
                         type="date" 
                         required
                         min={startDate}
                         value={endDate}
                         onChange={e => setEndDate(e.target.value)}
                         className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                       />
                    </div>
                 </div>

                 {startDate && endDate && (
                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                       Duration: <span className="text-brand-600 dark:text-brand-400">{getDuration(startDate, endDate)} days</span>
                    </div>
                 )}

                 <div>
                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Leave Type</label>
                    <div className="relative">
                        <select 
                        value={leaveType}
                        onChange={e => setLeaveType(e.target.value as LeaveType)}
                        className="appearance-none w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                        {Object.values(LeaveType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500 dark:text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Reason (Optional)</label>
                    <textarea 
                       rows={2}
                       value={reason}
                       onChange={e => setReason(e.target.value)}
                       className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white resize-none"
                       placeholder="Taking some time off..."
                    />
                 </div>

                 {/* Conflict Resolution Section */}
                 {conflictingTasks.length > 0 ? (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                       <h4 className="text-orange-800 dark:text-orange-200 font-bold flex items-center mb-3">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          Conflicting Tasks Found ({conflictingTasks.length})
                       </h4>
                       <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                          These tasks fall within your selected dates. Assign coverage if needed.
                       </p>
                       
                       <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                          {conflictingTasks.map(task => (
                             <div key={task.id} className={`flex flex-col gap-3 sm:flex-row sm:items-center justify-between p-3 rounded-lg border transition-colors ${
                                 task.isVirtual 
                                 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800' 
                                 : 'bg-white dark:bg-slate-800 border-orange-100 dark:border-slate-700'
                             }`}>
                                <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2 mb-1">
                                       {task.isVirtual && (
                                           <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500 text-white shadow-sm flex-shrink-0">
                                               Future
                                           </span>
                                       )}
                                       <div className={`font-bold text-sm truncate ${task.isVirtual ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`} title={task.title}>
                                           {task.title}
                                       </div>
                                   </div>
                                   <div className="flex items-center text-xs space-x-3">
                                      <span className={`${task.isVirtual ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500'} font-medium`}>
                                         Due: {new Date(task.dueDate).toLocaleDateString()}
                                      </span>
                                      {task.isVirtual && (
                                         <span className="text-indigo-400 dark:text-indigo-400">
                                            (Projected Recurrence)
                                         </span>
                                      )}
                                   </div>
                                </div>
                                <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-600 flex-shrink-0">
                                   <span className="text-xs text-slate-400 mx-2 whitespace-nowrap hidden sm:inline">Covered by</span>
                                   <div className="relative">
                                    <select 
                                        className="appearance-none text-sm border-none bg-transparent focus:ring-0 text-slate-700 dark:text-slate-200 font-medium outline-none cursor-pointer w-32 pr-6"
                                        value={reassignments[task.id] || currentUser.id}
                                        onChange={(e) => handleReassignmentChange(task.id, e.target.value)}
                                        style={{ backgroundColor: 'transparent' }} // Ensure transparency if using dark mode fix in parent
                                    >
                                        <option value={currentUser.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Me (No change)</option>
                                        {users.filter(u => u.id !== currentUser.id).map(user => (
                                            <option key={user.id} value={user.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{user.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-1 pointer-events-none text-slate-400">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 ) : (
                    startDate && endDate && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center text-green-700 dark:text-green-300">
                             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                             <span className="font-medium text-sm">No conflicting tasks found for these dates.</span>
                        </div>
                    )
                 )}

                 <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg font-medium shadow-lg shadow-brand-500/30 transition-transform active:scale-95">
                       {editingLeave ? 'Update Leave' : 'Book Leave'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
