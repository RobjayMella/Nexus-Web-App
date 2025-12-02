
import React, { useState } from 'react';
import { FileRepositoryItem, User } from '../types';

interface FileRepositoryProps {
  files: FileRepositoryItem[];
  users: User[];
  currentUser: User;
  onAddFile: (file: Omit<FileRepositoryItem, 'id' | 'createdAt'>) => void;
  onEditFile: (file: FileRepositoryItem) => void;
  onDeleteFile: (id: string) => void;
}

export const FileRepository: React.FC<FileRepositoryProps> = ({ files, users, currentUser, onAddFile, onEditFile, onDeleteFile }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileRepositoryItem | null>(null);
  
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileType, setNewFileType] = useState<FileRepositoryItem['type']>('Link');

  const handleOpenAdd = () => {
    setEditingFile(null);
    setNewFileName('');
    setNewFileUrl('');
    setNewFileType('Link');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (file: FileRepositoryItem) => {
    setEditingFile(file);
    setNewFileName(file.name);
    setNewFileUrl(file.url);
    setNewFileType(file.type);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFile) {
        onEditFile({
            ...editingFile,
            name: newFileName,
            url: newFileUrl,
            type: newFileType
        });
    } else {
        onAddFile({
            name: newFileName,
            url: newFileUrl,
            type: newFileType,
            uploadedBy: currentUser.id
        });
    }
    setNewFileName('');
    setNewFileUrl('');
    setNewFileType('Link');
    setEditingFile(null);
    setIsModalOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Dashboard': return <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
      case 'Report': return <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
      case 'Image': return <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
      default: return <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Files Repository</h2>
           <p className="text-slate-500 dark:text-slate-400">Manage links, dashboards, and documents.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/30 flex items-center justify-center font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Resource
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {files.length === 0 && (
           <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              No files in repository. Click "Add Resource" to start.
           </div>
        )}
        {files.map(file => (
          <div key={file.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow group relative">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                   {getIcon(file.type)}
                </div>
                <div className="flex space-x-1">
                   <button 
                     onClick={() => handleOpenEdit(file)}
                     className="text-slate-300 hover:text-brand-500 transition-colors p-1"
                     title="Edit"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                   </button>
                   <button 
                     onClick={() => onDeleteFile(file.id)}
                     className="text-slate-300 hover:text-red-500 transition-colors p-1"
                     title="Delete"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                </div>
             </div>
             
             <h3 className="font-bold text-slate-800 dark:text-white mb-1 truncate">{file.name}</h3>
             <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 dark:text-brand-400 hover:underline mb-4 block truncate">
                {file.url}
             </a>
             
             <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-3">
                <span>{file.type}</span>
                <span>Added by {users.find(u => u.id === file.uploadedBy)?.name || 'Unknown'}</span>
             </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6">
               <h3 className="text-xl font-bold mb-4 dark:text-white">{editingFile ? 'Edit Resource' : 'Add New Resource'}</h3>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium mb-1 dark:text-slate-300">Name</label>
                     <input 
                        type="text" 
                        required 
                        value={newFileName} 
                        onChange={e => setNewFileName(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg bg-transparent dark:border-slate-600 dark:text-white" 
                        placeholder="e.g. Q3 Marketing Report"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1 dark:text-slate-300">Type</label>
                     <div className="relative">
                        <select 
                            value={newFileType} 
                            onChange={e => setNewFileType(e.target.value as any)}
                            className="appearance-none w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                            <option value="Link">Link / URL</option>
                            <option value="Dashboard">Dashboard</option>
                            <option value="Report">Report</option>
                            <option value="Document">Document</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500 dark:text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1 dark:text-slate-300">URL / Link</label>
                     <input 
                        type="url" 
                        required 
                        value={newFileUrl} 
                        onChange={e => setNewFileUrl(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg bg-transparent dark:border-slate-600 dark:text-white" 
                        placeholder="https://..."
                     />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                     <button type="submit" className="px-4 py-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg">{editingFile ? 'Update' : 'Add Resource'}</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};
