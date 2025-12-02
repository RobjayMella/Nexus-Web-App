
import React, { useState } from 'react';
import { generateAiEmail, generateAiDocumentation, generateAiInfographic } from '../services/geminiService';

export const AiTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'email' | 'infographic' | 'docs'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Email State
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailTopic, setEmailTopic] = useState('');
  const [emailTone, setEmailTone] = useState('Professional');

  // Infographic State
  const [infoPrompt, setInfoPrompt] = useState('');
  const [infoDocContent, setInfoDocContent] = useState<string | null>(null);
  const [infoFileName, setInfoFileName] = useState<string | null>(null);

  // Docs State
  const [docTitle, setDocTitle] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [docFormat, setDocFormat] = useState('Markdown');
  const [includeToc, setIncludeToc] = useState(false);
  const [docFileContent, setDocFileContent] = useState<string | null>(null);
  const [docFileName, setDocFileName] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      if (activeTab === 'email') {
        const res = await generateAiEmail(emailRecipient, emailTopic, emailTone);
        setResult(res);
      } else if (activeTab === 'docs') {
        const res = await generateAiDocumentation(docTitle, docNotes, docFormat, includeToc, docFileContent || undefined);
        setResult(res);
      } else if (activeTab === 'infographic') {
        const res = await generateAiInfographic(infoPrompt, infoDocContent || undefined);
        setResult(res); // Base64 image string
      }
    } catch (e) {
      console.error(e);
      setResult("Error generating content.");
    } finally {
      setIsLoading(false);
    }
  };

  const processFile = (file: File, setContent: (s: string) => void, setName: (n: string) => void) => {
    setName(file.name);
    const reader = new FileReader();

    if (file.name.endsWith('.docx')) {
        reader.onload = (ev) => {
            const arrayBuffer = ev.target?.result as ArrayBuffer;
            // Use mammoth to extract text from docx
            if ((window as any).mammoth) {
                (window as any).mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                    .then((result: any) => {
                        setContent(result.value);
                    })
                    .catch((err: any) => {
                        console.error("Mammoth error:", err);
                        setContent("Error reading Google Doc/Word file.");
                    });
            } else {
                setContent("Error: Document parser not loaded.");
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        // Handle plain text files
        reader.onload = (ev) => {
            setContent(ev.target?.result as string);
        };
        reader.readAsText(file);
    }
  };

  const handleDocFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, setDocFileContent, setDocFileName);
    }
  };

  const handleInfoDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, setInfoDocContent, setInfoFileName);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">AI Studio</h2>
        <p className="text-slate-500 dark:text-slate-400">Generate content and assets using Gemini AI.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar / Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
          <button 
            onClick={() => { setActiveTab('email'); setResult(null); }}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'email' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <div className="font-bold">Email Generator</div>
            <div className={`text-xs ${activeTab === 'email' ? 'text-brand-100' : 'text-slate-500'}`}>Draft communications</div>
          </button>
          
          <button 
             onClick={() => { setActiveTab('infographic'); setResult(null); }}
             className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'infographic' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <div className="font-bold">Infographic Generator</div>
            <div className={`text-xs ${activeTab === 'infographic' ? 'text-purple-100' : 'text-slate-500'}`}>Create visual assets</div>
          </button>

          <button 
             onClick={() => { setActiveTab('docs'); setResult(null); }}
             className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'docs' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <div className="font-bold">Documentation</div>
            <div className={`text-xs ${activeTab === 'docs' ? 'text-emerald-100' : 'text-slate-500'}`}>Technical writing</div>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
           <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              
              {/* Email Form */}
              {activeTab === 'email' && (
                <div className="space-y-4">
                   <h3 className="text-xl font-bold mb-4 dark:text-white">Draft Email</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium mb-1 dark:text-slate-300">Recipient</label>
                        <input value={emailRecipient} onChange={e => setEmailRecipient(e.target.value)} type="text" className="w-full px-4 py-2 border rounded-lg bg-transparent dark:border-slate-600 dark:text-white" placeholder="e.g. Stakeholders, Team Lead" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium mb-1 dark:text-slate-300">Tone</label>
                        <div className="relative">
                            <select value={emailTone} onChange={e => setEmailTone(e.target.value)} className="appearance-none w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none">
                                <option>Professional</option>
                                <option>Casual</option>
                                <option>Persuasive</option>
                                <option>Urgent</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500 dark:text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                     </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1 dark:text-slate-300">Topic / Context</label>
                        <textarea value={emailTopic} onChange={e => setEmailTopic(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-transparent dark:border-slate-600 dark:text-white" rows={4} placeholder="What is this email about?" />
                     </div>
                   </div>
                </div>
              )}

              {/* Infographic Form */}
              {activeTab === 'infographic' && (
                 <div className="space-y-4">
                    <h3 className="text-xl font-bold mb-4 dark:text-white">Generate Infographic</h3>
                    <div>
                       <label className="block text-sm font-medium mb-1 dark:text-slate-300">Description</label>
                       <textarea value={infoPrompt} onChange={e => setInfoPrompt(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-transparent dark:border-slate-600 dark:text-white" rows={4} placeholder="Describe the data or process you want to visualize..." />
                       <p className="text-xs text-slate-500 mt-2">Example: A 4-step process diagram showing customer journey from awareness to purchase.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-slate-300">Source Document (Optional)</label>
                        <div className="flex flex-col gap-2">
                            <label className="cursor-pointer bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-4 py-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                                <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                Upload Google Doc (.docx), .txt, .md, .csv
                                <input type="file" className="hidden" accept=".txt,.md,.json,.csv,.docx" onChange={handleInfoDocUpload} />
                            </label>
                            {infoFileName && (
                                <div className="flex items-center text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    {infoFileName}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Upload a report or data summary. AI will analyze it to suggest the visual structure.</p>
                    </div>
                 </div>
              )}

              {/* Documentation Form */}
              {activeTab === 'docs' && (
                 <div className="space-y-4">
                    <h3 className="text-xl font-bold mb-4 dark:text-white">Generate Documentation</h3>
                    <div>
                       <label className="block text-sm font-medium mb-1 dark:text-slate-300">Title</label>
                       <input value={docTitle} onChange={e => setDocTitle(e.target.value)} type="text" className="w-full px-4 py-2 border rounded-lg bg-transparent dark:border-slate-600 dark:text-white" placeholder="e.g. User Authentication Flow" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-medium mb-1 dark:text-slate-300">Format</label>
                          <div className="relative">
                            <select 
                                value={docFormat} 
                                onChange={e => setDocFormat(e.target.value)} 
                                className="appearance-none w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                <option value="Markdown">Markdown</option>
                                <option value="Plain Text">Plain Text</option>
                                <option value="HTML">HTML</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500 dark:text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </div>
                       </div>
                       <div className="flex items-end pb-2">
                          <label className="flex items-center space-x-2 cursor-pointer dark:text-slate-300">
                             <input 
                               type="checkbox" 
                               checked={includeToc} 
                               onChange={e => setIncludeToc(e.target.checked)} 
                               className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                             />
                             <span className="text-sm font-medium">Include Table of Contents</span>
                          </label>
                       </div>
                    </div>
                    <div>
                       <label className="block text-sm font-medium mb-1 dark:text-slate-300">Upload Context (Optional)</label>
                        <div className="flex flex-col gap-2">
                            <label className="cursor-pointer bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-4 py-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                                <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Upload Google Doc (.docx), .txt, .md, .json
                                <input type="file" className="hidden" accept=".txt,.md,.json,.csv,.docx" onChange={handleDocFileUpload} />
                            </label>
                            {docFileName && (
                                <div className="flex items-center text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    {docFileName}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                       <label className="block text-sm font-medium mb-1 dark:text-slate-300">Key Notes & Details</label>
                       <textarea value={docNotes} onChange={e => setDocNotes(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-transparent dark:border-slate-600 dark:text-white" rows={6} placeholder="Paste rough notes, code snippets, or requirements here..." />
                    </div>
                 </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                 <button 
                   onClick={handleGenerate}
                   disabled={isLoading}
                   className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center"
                 >
                    {isLoading ? (
                       <>
                         <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         Generating...
                       </>
                    ) : (
                       'Generate Content'
                    )}
                 </button>
              </div>
           </div>

           {/* Results Area */}
           {result && (
              <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 animation-fade-in">
                 <h3 className="text-lg font-bold mb-4 dark:text-white">Generated Result</h3>
                 {activeTab === 'infographic' ? (
                    <div className="flex justify-center bg-slate-100 dark:bg-slate-900 p-4 rounded-xl">
                       <img src={result} alt="Generated Infographic" className="max-w-full h-auto rounded-lg shadow-lg" />
                    </div>
                 ) : (
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                       <pre className="whitespace-pre-wrap text-sm font-mono text-slate-700 dark:text-slate-300 overflow-x-auto">{result}</pre>
                    </div>
                 )}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
