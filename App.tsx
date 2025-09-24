
import React from 'react';
import Chatbot from './components/Chatbot';

const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <header className="bg-gray-800 shadow-md p-4 flex items-center space-x-3">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.22 8.22a.75.75 0 011.06 0l1.97 1.97a.75.75 0 01-1.06 1.06L6.22 9.28a.75.75 0 010-1.06zm5.56.25a.75.75 0 00-1.06-1.06L9.25 8.94a.75.75 0 101.06 1.06l1.47-1.47z" clipRule="evenodd" />
          <path d="M10 15.5a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM10 5.75a4.25 4.25 0 100 8.5 4.25 4.25 0 000-8.5z" />
        </svg>
        <h1 className="text-2xl font-bold tracking-wider">
          Ingres Groundwater Chatbot
        </h1>
      </header>
      <main className="flex-1 overflow-hidden">
        <Chatbot />
      </main>
    </div>
  );
};

export default App;
