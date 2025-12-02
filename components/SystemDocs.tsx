
import React from 'react';

const Section = ({ title, children }: { title: string, children?: React.ReactNode }) => (
  <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8">
    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">{title}</h2>
    <div className="text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed">
      {children}
    </div>
  </section>
);

const SubHeader = ({ children }: { children?: React.ReactNode }) => (
  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-6 mb-2 flex items-center">
    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mr-2"></span>
    {children}
  </h3>
);

export const SystemDocs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-fade-in">
      <div className="text-center py-8">
        <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent mb-3">
          Nexus Analyst Hub Documentation
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          Comprehensive guide to system capabilities, workflows, and technical architecture.
        </p>
      </div>

      <Section title="1. Authentication & Profile Management">
        <p>
          Nexus Analyst Hub uses a secure, streamlined authentication process designed for ease of access using Google Sign-In Integration.
        </p>
        
        <SubHeader>Accessing the System</SubHeader>
        <ul className="list-disc pl-6 space-y-2">
           <li><strong>Google Sign-In:</strong> Access is controlled via a centralized Google Sign-In button.</li>
           <li><strong>Account Selection:</strong> Clicking "Sign in with Google" will present you with an account chooser listing available profiles on your device (mocked for this environment).</li>
           <li><strong>New Users:</strong> To register a new profile, select <strong>"Use another account"</strong> from the chooser. You will be prompted to enter your Email and Name to instantiate a new Analyst Profile.</li>
        </ul>

        <SubHeader>Profile Settings</SubHeader>
        <p>
           Once logged in, you can customize your experience via the <strong>Settings</strong> tab:
        </p>
        <ul className="list-disc pl-6 space-y-2">
           <li><strong>Avatar:</strong> Upload a custom profile picture to be identified in task assignments and logs.</li>
           <li><strong>Theme Preferences:</strong> Toggle between Light Mode, Dark Mode, or sync with your System settings.</li>
        </ul>
      </Section>

      <Section title="2. Task Management System">
        <p>
          The core of the Nexus Hub is the Task Management system designed specifically for Business Analysts. 
          It distinguishes between two primary work streams:
        </p>
        
        <SubHeader>Task Types</SubHeader>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>BAU (Business As Usual):</strong> Recurring tasks such as weekly reports, daily checks, or maintenance. These tasks allow for a 'Frequency' field definition.</li>
          <li><strong>Ad-hoc:</strong> One-off project tasks, analysis requests, or specific documentation needs.</li>
        </ul>

        <SubHeader>Creating & Editing</SubHeader>
        <p>
          Users can create tasks via the "New Task" button. The form supports:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>AI Assist:</strong> Click the "AI Assist" button next to the title to automatically generate a detailed description and suggested subtasks based on the title.</li>
          <li><strong>Rich Text Description:</strong> The description field supports Markdown syntax (Bold, Italic, Lists) for clear formatting.</li>
          <li><strong>Deadlines:</strong> Tasks support both specific Due Dates and Due Times.</li>
          <li><strong>Attachments:</strong> Link files from the Repository directly to a task context.</li>
          <li><strong>Priority:</strong> Ranges from Low to Critical. Critical tasks are highlighted in red.</li>
        </ul>

        <SubHeader>Workflow & Status</SubHeader>
        <p>
          Tasks move through a Kanban-style lifecycle: <code>To Do</code> → <code>In Progress</code> → <code>In Review</code> → <code>Done</code>.
          Status changes are logged automatically in the system audit trail.
        </p>
      </Section>

      <Section title="3. AI Studio & Automation">
        <p>
          The AI Studio leverages Google's Gemini models to accelerate common BA deliverables.
        </p>

        <SubHeader>Email Generator</SubHeader>
        <p>
          Draft professional communications instantly. Enter the recipient, context, and desired tone (e.g., Professional, Casual, Urgent), and the AI will generate a complete email draft ready for sending.
        </p>

        <SubHeader>Infographic Generator</SubHeader>
        <p>
          Visualize complex data or processes. You can either describe the infographic manually or upload a source document (.docx, .txt, .md). The system analyzes the document to extract data points and generates a professional business infographic using the Imagen 3 model.
        </p>

        <SubHeader>Documentation Generator</SubHeader>
        <p>
          Convert rough notes into polished technical documentation. Provide a title and your raw notes, code snippets, or upload a Google Doc/Word file (.docx). The AI will structure this into a document with headers, bullet points, and sections. Supports output in Markdown, Plain Text, or HTML, with an optional Table of Contents.
        </p>
      </Section>

      <Section title="4. Technical Architecture & Application Logic">
        <p>
          This section outlines the technical stack and specific logic implementations governing the application's behavior.
        </p>

        <SubHeader>Tech Stack</SubHeader>
        <ul className="list-disc pl-6 space-y-2">
           <li><strong>Framework:</strong> React 19 (Functional Components, Hooks) with TypeScript for type safety.</li>
           <li><strong>Styling:</strong> Tailwind CSS (Utility-first) with dark mode support.</li>
           <li><strong>AI Integration:</strong> Google GenAI SDK (<code>@google/genai</code>).</li>
           <li><strong>Document Parsing:</strong> <code>mammoth.js</code> is used client-side to parse .docx (Google Docs export) files into raw text for AI context.</li>
           <li><strong>Persistence:</strong> <code>localStorage</code> is used to simulate a persistent database for Tasks, Users, Files, Leaves, and Logs.</li>
        </ul>

        <SubHeader>Core Logic: Recurring Tasks (BAU)</SubHeader>
        <p>
          The system implements a self-perpetuating task cycle for BAU items. 
          When a task marked as <code>BAU</code> with a specific <code>Frequency</code> (e.g., Weekly) is moved to the <strong>Done</strong> status:
        </p>
        <ol className="list-decimal pl-6 space-y-1 mt-2">
           <li>The system intercepts the status change.</li>
           <li>It calculates the <code>nextDueDate</code> based on the frequency (e.g., Current Date + 7 days).</li>
           <li>It immediately instantiates a <strong>new</strong> task with the same details but the new due date and resets the status to <code>To Do</code>.</li>
           <li>This ensures the workload is always up-to-date without manual duplication.</li>
        </ol>

        <SubHeader>Core Logic: Leave Tracker & Conflict Resolution</SubHeader>
        <p>
          The Leave Tracker uses advanced projection logic to ensure business continuity:
        </p>
        <ul className="list-disc pl-6 space-y-2">
           <li><strong>Conflict Detection:</strong> When a user selects leave dates, the system scans all tasks assigned to them falling within that range.</li>
           <li><strong>Future Projection:</strong> For BAU tasks, the system <em>virtually projects</em> future occurrences (up to 50 iterations or 1 year) that haven't been created yet but will fall during the leave period.</li>
           <li><strong>Virtual Tasks:</strong> These projected instances are presented in the UI as "Future" tasks, allowing the user to preemptively assign them to colleagues.</li>
           <li><strong>Batch Processing:</strong> Upon confirmation, the system updates existing tasks and actually <em>creates</em> the future tasks with the reassigned owner, ensuring no gaps in coverage.</li>
        </ul>

        <SubHeader>Data Models</SubHeader>
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg font-mono text-sm mt-2 overflow-x-auto">
           <p><strong>Task:</strong> {'{ id, title, type, status, priority, assigneeId, dueDate, frequency, fileIds... }'}</p>
           <p className="mt-2"><strong>User:</strong> {'{ id, name, email, role, avatar, themePreference }'}</p>
           <p className="mt-2"><strong>FileRepositoryItem:</strong> {'{ id, name, url, type, uploadedBy }'}</p>
           <p className="mt-2"><strong>LeaveRecord:</strong> {'{ id, userId, startDate, endDate, type, status }'}</p>
        </div>
      </Section>
    </div>
  );
};
