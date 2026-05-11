import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  GraduationCap, 
  Calendar, 
  FileText, 
  ClipboardCheck, 
  Dumbbell, 
  LogOut,
  Menu,
  X,
  BookOpen,
  Award
} from 'lucide-react';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Turmas', path: '/turmas', icon: GraduationCap },
    { name: 'Alunos', path: '/alunos', icon: Users },
    { name: 'Frequência', path: '/frequencia', icon: ClipboardCheck },
    { name: 'Relatórios', path: '/relatorios', icon: FileText },
    { name: 'Planos de Aula', path: '/planos', icon: BookOpen },
    { name: 'Criador de Provas', path: '/provas', icon: Award },
    { name: 'Biblioteca de Exercícios', path: '/exercicios', icon: Dumbbell },
  ];

  return (
    <>
      <button 
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-indigo-600 text-white rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col shrink-0 overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3 border-b border-slate-800 shrink-0">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shrink-0">
              LC
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold leading-tight truncate">Profª. Larissa Chaves</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold truncate">Educação Física</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            <div className="text-[10px] uppercase text-slate-500 font-bold px-3 py-2">Geral</div>
            {navItems.slice(0, 4).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
                onClick={() => setIsOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-50'}`} />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}

            <div className="text-[10px] uppercase text-slate-500 font-bold px-3 py-2 mt-4">Assistente IA</div>
            {navItems.slice(5, 8).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white group'}
                `}
                onClick={() => setIsOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-50'}`} />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}

            <div className="text-[10px] uppercase text-slate-500 font-bold px-3 py-2 mt-4">Sistema</div>
            {navItems.slice(4, 5).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white group'}
                `}
                onClick={() => setIsOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-50'}`} />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-white transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4 opacity-70" />
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 lg:hidden z-30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
