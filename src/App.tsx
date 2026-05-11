import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Turmas from './pages/Turmas';
import Alunos from './pages/Alunos';
import Frequencia from './pages/Frequencia';
import PlanosAula from './pages/PlanosAula';
import CriadorProvas from './pages/CriadorProvas';
import BibliotecaExercicios from './pages/BibliotecaExercicios';
import Relatorios from './pages/Relatorios';
import Sidebar from './components/layout/Sidebar';
import { motion, AnimatePresence } from 'motion/react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 w-full max-w-sm hidden md:flex">
            <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round"></path>
            </svg>
            <input 
              type="text" 
              placeholder="Pesquisar turmas ou planos..." 
              className="bg-transparent border-none focus:outline-none text-xs text-slate-600 w-full"
            />
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-200 uppercase tracking-tighter">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              Firebase Conectado
            </div>
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 text-xs">
              LC
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto custom-scrollbar overflow-x-hidden">
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </main>
        
        <footer className="h-10 bg-white border-t border-slate-200 px-8 hidden md:flex items-center justify-between shrink-0 text-[10px] text-slate-500 font-medium">
          <div>© 2024 Profª Larissa Chaves — Gestão Escolar & IA</div>
          <div className="flex gap-4">
            <span>Versão 2.4.0</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> 
              Sistema Online
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/turmas" element={<ProtectedRoute><Turmas /></ProtectedRoute>} />
          <Route path="/alunos" element={<ProtectedRoute><Alunos /></ProtectedRoute>} />
          <Route path="/frequencia" element={<ProtectedRoute><Frequencia /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
          <Route path="/planos" element={<ProtectedRoute><PlanosAula /></ProtectedRoute>} />
          <Route path="/provas" element={<ProtectedRoute><CriadorProvas /></ProtectedRoute>} />
          <Route path="/exercicios" element={<ProtectedRoute><BibliotecaExercicios /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
