import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Save, 
  FileText, 
  Download, 
  History, 
  Trash2, 
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Printer
} from 'lucide-react';
import { 
  generateLessonPlan, 
  checkIAUsage, 
  incrementIAUsage 
} from '../services/gemini';
import { db, auth } from '../services/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { PlanoAula } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PlanosAula = () => {
  const [formData, setFormData] = useState({
    serie: '',
    tema: '',
    duracao: '50 minutos',
    quantidadeAlunos: 20,
    materiais: '',
    objetivo: ''
  });
  
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [history, setHistory] = useState<PlanoAula[]>([]);
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState({ canUse: true, remaining: 0 });
  const [viewingPlan, setViewingPlan] = useState<PlanoAula | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchUsage();
    fetchHistory();
  }, []);

  const fetchUsage = async () => {
    const res = await checkIAUsage();
    setUsage(res);
  };

  const fetchHistory = async () => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'planosAula'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlanoAula)));
  };

  const handleGenerate = async () => {
    if (!usage.canUse) {
      alert('Limite de uso diário/mensal da IA atingido.');
      return;
    }
    
    setLoading(true);
    try {
      const plan = await generateLessonPlan(formData);
      setGeneratedPlan(plan);
      await incrementIAUsage();
      fetchUsage();
    } catch (err: any) {
      console.error("Erro IA:", err);
      if (err.message === "AI_KEY_MISSING") {
        alert('Configuração incompleta: API Key da Gemini não encontrada. Por favor, configure a variável de ambiente VITE_GEMINI_API_KEY.');
      } else {
        alert('Erro ao gerar plano de aula.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedPlan || !auth.currentUser) return;
    try {
      await addDoc(collection(db, 'planosAula'), {
        ...formData,
        conteudo: generatedPlan,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      alert('Plano salvo com sucesso!');
      setGeneratedPlan(null);
      fetchHistory();
    } catch (err) {
      console.error("Erro salvar:", err);
    }
  };

  const exportPDF = (plan: PlanoAula | any, isNew = false) => {
    const doc = new jsPDF();
    const content = isNew ? plan : plan.conteudo;
    const meta = isNew ? formData : plan;

    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text("Plano de Aula: " + meta.tema, 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Série: ${meta.serie} | Duração: ${meta.duracao}`, 20, 30);
    doc.text(`Profª. Larissa Chaves`, 20, 37);

    let y = 45;
    const sections = [
      { t: "Objetivo Geral", c: content.objetivoGeral },
      { t: "Aquecimento", c: content.aquecimento },
      { t: "Atividade Principal", c: content.atividadePrincipal },
      { t: "Alongamento", c: content.alongamento },
      { t: "Encerramento", c: content.encerramento },
      { t: "Avaliação", c: content.avaliacao },
      { t: "BNCC", c: content.habilidadesBNCC },
    ];

    sections.forEach(s => {
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(s.t, 20, y);
      y += 7;
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(s.c, 170);
      doc.text(lines, 20, y);
      y += (lines.length * 5) + 10;
      
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`Plano_Aula_${meta.tema.replace(/\s+/g, '_')}.pdf`);
  };

  const deletePlan = async (id: string) => {
    if (window.confirm('Excluir este plano permanentemente?')) {
      await deleteDoc(doc(db, 'planosAula', id));
      fetchHistory();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Plano de Aula Inteligente</h1>
          <p className="text-slate-500">Gere roteiros completos em segundos com IA.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-500 border border-slate-200">
            {usage.remaining} USOS RESTANTES HOJE
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 shadow-sm"
            title="Ver histórico"
          >
            <History className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Série</label>
              <input 
                type="text" 
                placeholder="Ex: 6º Ano"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                value={formData.serie}
                onChange={(e) => setFormData({...formData, serie: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duração</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                value={formData.duracao}
                onChange={(e) => setFormData({...formData, duracao: e.target.value})}
              >
                <option value="50 minutos">50 minutos</option>
                <option value="1h 40min">1h 40min</option>
                <option value="2 horas">2 horas</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tema da Aula</label>
            <input 
              type="text" 
              placeholder="Ex: Handebol, Atletismo, Jogos Populares..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              value={formData.tema}
              onChange={(e) => setFormData({...formData, tema: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Materiais Disponíveis</label>
            <textarea 
              rows={2}
              placeholder="Ex: Bolas, cones, cordas..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
              value={formData.materiais}
              onChange={(e) => setFormData({...formData, materiais: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Objetivo Pedagógico (Opcional)</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
              value={formData.objetivo}
              onChange={(e) => setFormData({...formData, objetivo: e.target.value})}
            />
          </div>
          
          <button 
            onClick={handleGenerate}
            disabled={loading || !formData.tema || !formData.serie || !usage.canUse}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
            Gerar Plano com IA
          </button>
        </section>

        {/* Resultado */}
        <section className="bg-slate-100 p-1 rounded-3xl min-h-[400px] flex flex-col">
          <div className="bg-white m-1 p-6 rounded-3xl flex-1 border border-white overflow-y-auto max-h-[600px] custom-scrollbar">
            {!generatedPlan ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium">Aguardando geração do plano...</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="font-bold text-indigo-600 uppercase tracking-widest text-xs">Conteúdo Gerado</h3>
                  <div className="flex gap-2">
                    <button onClick={() => exportPDF(generatedPlan, true)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><Download className="w-5 h-5" /></button>
                    <button onClick={handleSave} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600"><Save className="w-5 h-5" /></button>
                  </div>
                </div>
                
                <div className="space-y-4 text-slate-700">
                  <section>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Objetivo Geral</h4>
                    <p className="text-sm leading-relaxed">{generatedPlan.objetivoGeral}</p>
                  </section>
                  <section>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Aquecimento</h4>
                    <p className="text-sm leading-relaxed">{generatedPlan.aquecimento}</p>
                  </section>
                  <section>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Atividade Principal</h4>
                    <p className="text-sm leading-relaxed">{generatedPlan.atividadePrincipal}</p>
                  </section>
                  <section>
                    <h4 className="font-bold text-indigo-600 text-[10px] uppercase font-bold tracking-wider mt-4">Habilidades BNCC</h4>
                    <p className="text-xs bg-indigo-50 p-3 rounded-xl border border-indigo-100">{generatedPlan.habilidadesBNCC}</p>
                  </section>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      </div>

      {/* Histórico Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Planos Salvos</h2>
                <button onClick={() => setShowHistory(false)} className="text-slate-400"><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.map(item => (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-slate-800 leading-tight">{item.tema}</h4>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => exportPDF(item)} className="p-2 text-indigo-600 hover:bg-white rounded-lg transition-colors"><Download className="w-4 h-4" /></button>
                         <button onClick={() => deletePlan(item.id)} className="p-2 text-red-500 hover:bg-white rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                    <div className="flex gap-2 text-[10px] text-slate-400 font-bold">
                       <span className="px-2 py-1 bg-white rounded-md border border-slate-100 uppercase">{item.serie}</span>
                       <span className="px-2 py-1 bg-white rounded-md border border-slate-100 uppercase">{item.duracao}</span>
                    </div>
                  </div>
                ))}
                {history.length === 0 && <p className="text-center text-slate-400 py-12">Nenhum plano salvo.</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlanosAula;
