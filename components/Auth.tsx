import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (name: string, email: string) => void;
  users: User[];
}

export const Auth: React.FC<AuthProps> = ({ onLogin, users }) => {
  const [view, setView] = useState<'landing' | 'chooser' | 'create'>('landing');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleClick = () => {
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setIsLoading(false);
      setView('chooser');
    }, 800);
  };

  const handleUserSelect = (user: User) => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin(user.name, user.email);
    }, 600);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setIsLoading(true);
      setTimeout(() => {
        onLogin(name || email.split('@')[0], email);
      }, 800);
    }
  };

  // Google Logo SVG
  const GoogleLogo = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );

  const LandingView = () => (
    <div className="text-center">
      <div className="flex justify-center mb-6">
         <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
         </div>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Nexus Analyst Hub</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Empowering Business Analysts with AI-driven workflows.</p>
      
      <div className="space-y-4">
        <button
          onClick={handleGoogleClick}
          disabled={isLoading}
          className="w-full flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium py-3 px-4 rounded-lg transition-all transform active:scale-95 relative overflow-hidden"
        >
          {isLoading ? (
             <svg className="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : (
             <>
               <GoogleLogo />
               <span>Sign in with Google</span>
             </>
          )}
        </button>
      </div>

      <p className="mt-8 text-xs text-slate-400">
        By continuing, you agree to the Nexus Terms of Service and Privacy Policy.
      </p>
    </div>
  );

  const ChooserView = () => (
    <div className="text-left animate-fade-in">
       <div className="flex flex-col items-center mb-6">
          <GoogleLogo />
          <h2 className="text-xl font-medium text-slate-800 dark:text-white mt-2">Choose an account</h2>
          <p className="text-sm text-slate-500">to continue to Nexus Analyst Hub</p>
       </div>

       <div className="space-y-1 max-h-80 overflow-y-auto -mx-4">
          {users.map(user => (
             <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className="w-full flex items-center px-8 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0"
             >
                {user.avatar ? (
                   <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover mr-4" />
                ) : (
                   <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mr-4 text-lg">
                      {user.name.charAt(0)}
                   </div>
                )}
                <div className="text-left">
                   <div className="font-medium text-slate-700 dark:text-slate-200">{user.name}</div>
                   <div className="text-xs text-slate-500">{user.email}</div>
                </div>
             </button>
          ))}
          
          <button
             onClick={() => setView('create')}
             className="w-full flex items-center px-8 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-600 dark:text-slate-300 font-medium"
          >
             <div className="w-10 flex justify-center mr-4">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v-4m0 0V7m0 3h3m-3 0H9" /></svg>
             </div>
             Use another account
          </button>
       </div>
    </div>
  );

  const CreateView = () => (
    <div className="animate-fade-in">
       <div className="flex flex-col items-center mb-6">
          <GoogleLogo />
          <h2 className="text-xl font-medium text-slate-800 dark:text-white mt-2">Sign in</h2>
          <p className="text-sm text-slate-500">with your Google Account</p>
       </div>

       <form onSubmit={handleCreateSubmit} className="space-y-6 pt-2">
         <div className="relative">
            <input
               type="text"
               required
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="peer block w-full px-3 py-3 border border-slate-300 dark:border-slate-600 rounded bg-transparent text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               placeholder="Email"
               id="email"
            />
            <label htmlFor="email" className="absolute left-3 -top-2.5 bg-white dark:bg-slate-800 px-1 text-xs text-blue-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-600">
               Email or phone
            </label>
         </div>

         {email && (
            <div className="relative animate-fade-in">
               <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="peer block w-full px-3 py-3 border border-slate-300 dark:border-slate-600 rounded bg-transparent text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Full Name"
                  id="name"
               />
               <label htmlFor="name" className="absolute left-3 -top-2.5 bg-white dark:bg-slate-800 px-1 text-xs text-blue-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-600">
                  Full Name (for profile)
               </label>
            </div>
         )}

         <div className="flex justify-between items-center pt-4">
            <button 
               type="button" 
               onClick={() => setView('chooser')}
               className="text-blue-600 font-medium text-sm hover:text-blue-700"
            >
               Back
            </button>
            <button
               type="submit"
               className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
               Next
            </button>
         </div>
       </form>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 p-4 font-sans">
      <div className={`w-full max-w-[400px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${view === 'landing' ? 'p-10' : 'p-8 pt-10'}`}>
        {isLoading && view !== 'landing' ? (
           <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500">Signing in...</p>
           </div>
        ) : (
           <>
              {view === 'landing' && <LandingView />}
              {view === 'chooser' && <ChooserView />}
              {view === 'create' && <CreateView />}
           </>
        )}
      </div>
    </div>
  );
};