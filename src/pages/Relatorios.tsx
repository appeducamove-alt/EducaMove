import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  BarChart, 
  Users, 
  TrendingUp, 
  Award,
  Loader2,
  Filter
} from 'lucide-react';
import { db } from '../services/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Turma, Aluno, Frequencia } from '../types';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Relatorios = () => {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [alunos, setAlunos] = useState<Aluno[]>([]);

  useEffect(() => {
    const fetchTurmas = async () => {
      const snap = await getDocs(collection(db, 'turmas'));
      setTurmas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Turma)));
    };
    fetchTurmas();
  }, []);

  const generateReport = async () => {
    if (!selectedTurma) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'alunos'), where('turmaId', '==', selectedTurma));
      const snap = await getDocs(q);
      const fetchedAlunos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Aluno));
      setAlunos(fetchedAlunos);
      
      const turma = turmas.find(t => t.id === selectedTurma);
      
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text("Relatório de Turma: " + (turma?.nome || ''), 20, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(`Série: ${turma?.serie} | Emitido em: ${new Date().toLocaleDateString()}`, 20, 30);

      const tableData = fetchedAlunos.map(a => [
        a.nome,
        a.frequenciaCount || 0,
        a.presencaCount || 0,
        a.frequenciaCount ? `${((a.presencaCount / a.frequenciaCount) * 100).toFixed(1)}%` : '0%'
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Aluno', 'Total Chamadas', 'Presenças', '% Frequência']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
      });

      doc.save(`Relatorio_${turma?.nome}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Relatórios e Desempenho</h1>
        <p className="text-slate-500">Exporte dados consolidados de presença e participação.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-2">
            <BarChart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Relatório de Frequência</h3>
            <p className="text-sm text-slate-500">Lista completa de alunos com porcentagem de presença e total de faltas.</p>
          </div>
          
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Selecione a Turma</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                value={selectedTurma}
                onChange={(e) => setSelectedTurma(e.target.value)}
              >
                <option value="">Selecione uma turma</option>
                {turmas.map(t => (
                  <option key={t.id} value={t.id}>{t.nome} - {t.serie}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={generateReport}
              disabled={loading || !selectedTurma}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
              Gerar Relatório PDF
            </button>
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
           <div>
             <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
               <Award className="w-6 h-6" />
             </div>
             <h3 className="font-bold text-slate-800 text-lg">Exportação em Lote</h3>
             <p className="text-sm text-slate-500 mb-4">Em breve: Relatórios individuais por aluno e boletins de desempenho físico.</p>
           </div>
           <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200 text-center">
             <TrendingUp className="w-8 h-8 text-slate-200 mx-auto mb-2" />
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Módulo em Desenvolvimento</p>
           </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Participação', color: 'bg-blue-50 text-blue-600' },
          { label: 'Notas Finais', color: 'bg-purple-50 text-purple-600' },
          { label: 'Histórico de Lesões', color: 'bg-red-50 text-red-600' },
        ].map((item, i) => (
          <div key={i} className={`p-6 rounded-2xl border border-slate-100 shadow-sm ${item.color} opacity-60 flex items-center justify-between`}>
             <span className="font-bold text-sm uppercase tracking-wider">{item.label}</span>
             <FileText className="w-5 h-5" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Relatorios;
