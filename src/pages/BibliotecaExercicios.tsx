import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Save, 
  Search, 
  Filter, 
  Heart, 
  Dumbbell, 
  Loader2, 
  X,
  Plus,
  Download,
  Trash2,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { 
  generateExercise, 
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
  orderBy,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { Exercicio } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import { usePagination } from '../hooks/usePagination';

const BibliotecaExercicios = () => {
  const { items: exercicios, loading: loadingItems, hasMore, fetchItems, reset } = usePagination<Exercicio>('exercicios', 12);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [usage, setUsage] = useState({ canUse: true, remaining: 0 });
  const [viewingEx, setViewingEx] = useState<Exercicio | any>(null);
  const [showGenModal, setShowGenModal] = useState(false);
  
  const [filters, setFilters] = useState({
    idade: '',
    serie: '',
    objetivo: '',
    espaco: 'Qualquer',
    material: 'Qualquer'
  });

  useEffect(() => {
    fetchItems();
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    const res = await checkIAUsage();
    setUsage(res);
  };

  const handleGenerate = async () => {
    if (!usage.canUse) {
      alert('Limite de uso atingido.');
      return;
    }
    setIsGenerating(true);
    try {
      const ex = await generateExercise(filters);
      const newEx = {
        ...ex,
        ...filters,
        favorito: false,
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'exercicios'), newEx);
      await incrementIAUsage();
      fetchUsage();
      reset();
      fetchItems();
      setViewingEx({ id: docRef.id, ...newEx });
      setShowGenModal(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar exercício.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, exercise: Exercicio) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'exercicios', exercise.id), {
        favorito: !exercise.favorito
      });
      reset();
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const exportPDF = (ex: any) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.text(ex.titulo, 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Filtros: ${ex.idade} | ${ex.serie} | ${ex.espaco} | ${ex.material}`, 20, 30);
    
    let y = 45;
    const contents = [
      { t: "Descrição", c: ex.descricao },
      { t: "Execução", c: ex.execucao },
      { t: "Materiais Necessários", c: ex.materiaisList },
      { t: "Objetivo Pedagógico", c: ex.objetivoPedagogico },
    ];

    contents.forEach(s => {
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(s.t, 20, y);
      y += 7;
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(s.c, 170);
      doc.text(lines, 20, y);
      y += (lines.length * 5) + 10;
    });

    doc.save(`Atividade_${ex.titulo}.pdf`);
  };

  const filteredItems = exercicios.filter(ex => 
    ex.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.objetivo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Biblioteca Inteligente</h1>
          <p className="text-slate-500">Banco de exercícios e brincadeiras gerados e salvos.</p>
        </div>
        <button 
          onClick={() => setShowGenModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
        >
          <Sparkles className="w-5 h-5" />
          Gerar Novo Exercício
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Pesquisar na biblioteca..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {filteredItems.map((ex) => (
            <motion.div 
              key={ex.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5 }}
              onClick={() => setViewingEx(ex)}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <button onClick={(e) => toggleFavorite(e, ex)} className={`p-2 rounded-lg transition-colors ${ex.favorito ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-red-400'}`}>
                    <Heart className={`w-5 h-5 ${ex.favorito ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <h3 className="font-bold text-slate-800 line-clamp-2 mb-1">{ex.titulo}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">{ex.serie || 'Série Livre'}</p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] px-2 py-1 bg-slate-50 text-slate-500 rounded-md font-bold border border-slate-100">{ex.material === 'Qualquer' ? 'Sem Material' : 'C/ Material'}</span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button 
            onClick={() => fetchItems(true)}
            className="flex items-center gap-2 px-6 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
            disabled={loadingItems}
          >
            {loadingItems ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Carregar mais'}
          </button>
        </div>
      )}

      {/* Modal Visualização */}
      <AnimatePresence>
        {viewingEx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingEx(null)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100"><Dumbbell className="w-6 h-6" /></div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{viewingEx.titulo}</h2>
                    <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest">{viewingEx.serie} • {viewingEx.espaco}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => exportPDF(viewingEx)} className="p-2 bg-slate-50 text-indigo-600 rounded-xl"><Download className="w-5 h-5" /></button>
                  <button onClick={() => deleteDoc(doc(db, 'exercicios', viewingEx.id)).then(() => {setViewingEx(null); reset(); fetchItems();})} className="p-2 bg-red-50 text-red-500 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                  <button onClick={() => setViewingEx(null)} className="p-2 text-slate-400"><X /></button>
                </div>
              </div>
              <div className="p-8 overflow-y-auto space-y-6">
                <section>
                  <h4 className="font-bold text-slate-900 border-l-4 border-indigo-500 pl-3 mb-2">Descrição</h4>
                  <p className="text-slate-600 leading-relaxed">{viewingEx.descricao}</p>
                </section>
                <section>
                  <h4 className="font-bold text-slate-900 border-l-4 border-indigo-500 pl-3 mb-2">Execução Passo a Passo</h4>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{viewingEx.execucao}</p>
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <h4 className="font-bold text-slate-800 text-sm mb-2 uppercase tracking-wider text-[10px]">Materiais</h4>
                    <p className="text-sm text-slate-600">{viewingEx.materiaisList}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-2xl">
                    <h4 className="font-bold text-indigo-800 text-sm mb-2 uppercase tracking-wider text-[10px]">Objetivo Pedagógico</h4>
                    <p className="text-sm text-indigo-900 font-medium">{viewingEx.objetivoPedagogico}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Geração IA */}
      <AnimatePresence>
        {showGenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGenModal(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600" /> IA Exercise Scout</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Idade Alvo</label>
                     <input type="text" placeholder="Ex: 10-12 anos" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={filters.idade} onChange={e => setFilters({...filters, idade: e.target.value})} />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Série</label>
                     <input type="text" placeholder="Ex: 5º Ano" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={filters.serie} onChange={e => setFilters({...filters, serie: e.target.value})} />
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Objetivo (ex: Coordenação, Cardio)</label>
                   <input type="text" placeholder="Qual a finalidade?" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={filters.objetivo} onChange={e => setFilters({...filters, objetivo: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Espaço</label>
                     <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={filters.espaco} onChange={e => setFilters({...filters, espaco: e.target.value})}>
                        <option>Qualquer</option>
                        <option>Sala Fechada</option>
                        <option>Quadra</option>
                        <option>Espaço Aberto</option>
                        <option>Piscina</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Material</label>
                     <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={filters.material} onChange={e => setFilters({...filters, material: e.target.value})}>
                        <option>Qualquer</option>
                        <option>Com Material</option>
                        <option>Sem Material</option>
                     </select>
                   </div>
                </div>
                
                <div className="pt-6">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                    <span>{usage.remaining} CRÉDITOS DISPONÍVEIS</span>
                  </div>
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !usage.canUse}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                    Consultar IA Inteligente
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BibliotecaExercicios;
