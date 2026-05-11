import React, { useEffect, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  FileText, 
  BookOpen, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles
} from 'lucide-react';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Turma, Aluno, PlanoAula, Prova } from '../types';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    turmas: 0,
    alunos: 0,
    planos: 0,
    provas: 0
  });
  const [recentPlans, setRecentPlans] = useState<PlanoAula[]>([]);
  const [recentExams, setRecentExams] = useState<Prova[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const turmasSnap = await getDocs(collection(db, 'turmas'));
        const alunosSnap = await getDocs(collection(db, 'alunos'));
        const planosSnap = await getDocs(query(collection(db, 'planosAula'), orderBy('createdAt', 'desc'), limit(5)));
        const provasSnap = await getDocs(query(collection(db, 'provas'), orderBy('createdAt', 'desc'), limit(5)));

        setStats({
          turmas: turmasSnap.size,
          alunos: alunosSnap.size,
          planos: planosSnap.size,
          provas: provasSnap.size
        });

        setRecentPlans(planosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlanoAula)));
        setRecentExams(provasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prova)));
      } catch (error) {
        console.error("Erro dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const data = [
    { name: 'Turmas', total: stats.turmas },
    { name: 'Alunos', total: stats.alunos / 10 }, // Scale for visual
    { name: 'Planos', total: stats.planos },
    { name: 'Provas', total: stats.provas },
  ];

  const StatCard = ({ title, value, icon: Icon, color, delay, trend }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-32"
    >
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 leading-none">{value}</h3>
      </div>
      {trend && (
        <div className={`mt-3 text-[11px] font-medium flex items-center gap-1 ${trend.positive ? 'text-emerald-600' : 'text-amber-600'}`}>
          {trend.positive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
             <TrendingUp className="w-3 h-3 rotate-180" />
          )}
          {trend.text}
        </div>
      )}
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Panorama geral das suas atividades acadêmicas.</p>
        </div>
        <div className="flex gap-2">
           <Link to="/planos" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm">Nova Aula IA</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Turmas" value={stats.turmas} icon={GraduationCap} delay={0.1} trend={{ text: '2 esta semana', positive: true }} />
        <StatCard title="Total Alunos" value={stats.alunos} icon={Users} delay={0.2} trend={{ text: 'Firestore Sincronizado', positive: true }} />
        <StatCard title="Planos Ativos" value={stats.planos} icon={FileText} delay={0.3} trend={{ text: 'Ver todos', positive: false }} />
        <StatCard title="Presença Média" value="92%" icon={BookOpen} delay={0.4} trend={{ text: '+4% vs mês passado', positive: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[400px]">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Recentes no Sistema</h2>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Últimos documentos gerados</p>
            </div>
            <button className="text-xs font-bold text-indigo-600 hover:underline">Ver Histórico</button>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100 bg-slate-50/30">
                  <th className="px-6 py-3 font-bold">Documento</th>
                  <th className="px-6 py-3 font-bold">Série</th>
                  <th className="px-6 py-3 font-bold">Status</th>
                  <th className="px-6 py-3 font-bold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-700 divide-y divide-slate-50">
                {recentPlans.map(plan => (
                  <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      Plano: {plan.tema}
                    </td>
                    <td className="px-6 py-4">{plan.serie}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">CONCLUÍDO</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to="/planos" className="text-indigo-600 hover:text-indigo-800 font-bold">Ver</Link>
                    </td>
                  </tr>
                ))}
                {recentExams.map(exam => (
                  <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                       <Award className="w-4 h-4 text-slate-400" />
                       Prova: {exam.tema}
                    </td>
                    <td className="px-6 py-4">{exam.serie}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">SALVO</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Link to="/provas" className="text-indigo-600 hover:text-indigo-800 font-bold">Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
             <div>Mostrando atividades recentes</div>
             <div>Total: {stats.planos + stats.provas}</div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="bg-indigo-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-20 h-20" />
            </div>
            <h3 className="text-lg font-bold mb-2 z-10 relative">Assistente IA</h3>
            <p className="text-xs text-indigo-100 mb-6 leading-relaxed z-10 relative">
              Crie planos de aula e provas personalizadas usando o poder do Gemini AI.
            </p>
            <div className="grid grid-cols-2 gap-3 z-10 relative">
              <Link to="/planos" className="bg-white text-indigo-700 text-center text-xs font-bold py-2.5 rounded-lg hover:bg-indigo-50 shadow-sm">Novo Plano</Link>
              <Link to="/provas" className="bg-indigo-600 text-white border border-indigo-500 text-center text-xs font-bold py-2.5 rounded-lg hover:bg-indigo-500">Nova Prova</Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Próximas Chamadas</h4>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Agenda diária</p>
            </div>
            <div className="space-y-3">
               <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded text-blue-700 flex items-center justify-center font-bold text-xs italic shrink-0">EF</div>
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">EF Fundamental</p>
                      <p className="text-[10px] text-slate-500">Pendente hoje</p>
                    </div>
                  </div>
                  <Link to="/frequencia" className="px-3 py-1.5 bg-indigo-600 text-white rounded text-[10px] font-bold shadow-sm whitespace-nowrap">Chamada</Link>
               </div>
            </div>
            <Link to="/frequencia" className="block text-center text-xs font-bold text-slate-500 hover:text-indigo-600 py-2">Ver agenda completa</Link>
          </div>
        </aside>
      </div>
    </motion.div>
  );
};

export default Dashboard;
