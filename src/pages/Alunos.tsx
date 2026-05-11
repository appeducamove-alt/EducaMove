import React, { useEffect, useState } from 'react';
import { usePagination } from '../hooks/usePagination';
import { Aluno, Turma } from '../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  Loader2,
  Filter,
  Phone,
  User,
  HeartPulse
} from 'lucide-react';
import { 
  addDoc, 
  collection, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  deleteDoc,
  getDocs,
  orderBy
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'motion/react';

const Alunos = () => {
  const { items: alunos, loading, hasMore, fetchItems, reset } = usePagination<Aluno>('alunos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState('todas');
  
  const [formData, setFormData] = useState({
    nome: '',
    idade: 0,
    turmaId: '',
    observacoes: '',
    restricoesFisicas: '',
    responsavel: '',
    telefone: ''
  });

  useEffect(() => {
    fetchItems();
    const fetchTurmas = async () => {
      const snap = await getDocs(collection(db, 'turmas'));
      setTurmas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Turma)));
    };
    fetchTurmas();
  }, []);

  const handleOpenModal = (aluno: Aluno | null = null) => {
    if (aluno) {
      setEditingAluno(aluno);
      setFormData({
        nome: aluno.nome,
        idade: aluno.idade,
        turmaId: aluno.turmaId,
        observacoes: aluno.observacoes || '',
        restricoesFisicas: aluno.restricoesFisicas || '',
        responsavel: aluno.responsavel || '',
        telefone: aluno.telefone || ''
      });
    } else {
      setEditingAluno(null);
      setFormData({
        nome: '',
        idade: 0,
        turmaId: '',
        observacoes: '',
        restricoesFisicas: '',
        responsavel: '',
        telefone: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAluno) {
        await updateDoc(doc(db, 'alunos', editingAluno.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'alunos'), {
          ...formData,
          frequenciaCount: 0,
          presencaCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      reset();
      fetchItems();
    } catch (err) {
      console.error("Erro ao salvar aluno:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este aluno?')) {
      try {
        await deleteDoc(doc(db, 'alunos', id));
        reset();
        fetchItems();
      } catch (err) {
        console.error("Erro ao excluir aluno:", err);
      }
    }
  };

  const filteredAlunos = alunos.filter(a => {
    const matchesSearch = a.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTurma = selectedTurma === 'todas' || a.turmaId === selectedTurma;
    return matchesSearch && matchesTurma;
  });

  const getTurmaName = (id: string) => turmas.find(t => t.id === id)?.nome || 'N/A';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Alunos</h1>
          <p className="text-slate-500">Monitoramento individual e participação.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
        >
          <Plus className="w-5 h-5" />
          Novo Aluno
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Pesquisar por nome do aluno..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <select 
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm appearance-none"
            value={selectedTurma}
            onChange={(e) => setSelectedTurma(e.target.value)}
          >
            <option value="todas">Todas as Turmas</option>
            {turmas.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredAlunos.map((aluno) => (
            <motion.div 
              key={aluno.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              <div className="p-5 border-b border-slate-50 flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{aluno.nome}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{getTurmaName(aluno.turmaId)}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(aluno)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(aluno.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-5 grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Responsável</span>
                  <p className="text-sm text-slate-700 font-medium truncate">{aluno.responsavel || '-'}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Telefone</span>
                  <p className="text-sm text-slate-700 font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {aluno.telefone || '-'}
                  </p>
                </div>
                {aluno.restricoesFisicas && (
                  <div className="col-span-2 bg-red-50 p-2 rounded-lg flex items-start gap-2 border border-red-100">
                    <HeartPulse className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[10px] text-red-600 uppercase font-bold tracking-tighter">Restrição Física</span>
                      <p className="text-xs text-red-800 leading-tight">{aluno.restricoesFisicas}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="px-5 py-3 bg-slate-50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400">Freq.</span>
                  <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${aluno.frequenciaCount ? (aluno.presencaCount / aluno.frequenciaCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <span className="font-bold text-slate-600">
                   {aluno.presencaCount}/{aluno.frequenciaCount}
                </span>
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
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Carregar mais alunos'}
          </button>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">{editingAluno ? 'Editar Aluno' : 'Novo Aluno'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Idade</label>
                  <input 
                    type="number" 
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    value={formData.idade || ''}
                    onChange={(e) => setFormData({...formData, idade: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Turma</label>
                  <select 
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    value={formData.turmaId}
                    onChange={(e) => setFormData({...formData, turmaId: e.target.value})}
                  >
                    <option value="">Selecione uma turma</option>
                    {turmas.map(t => (
                      <option key={t.id} value={t.id}>{t.nome} - {t.serie}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Restrições Físicas (Saúde)</label>
                  <textarea 
                    rows={2}
                    placeholder="Ex: Asma, Problemas cardíacos, etc."
                    className="w-full px-4 py-2 bg-red-50/50 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all resize-none text-red-900"
                    value={formData.restricoesFisicas}
                    onChange={(e) => setFormData({...formData, restricoesFisicas: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Responsável</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone Responsável</label>
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  />
                </div>
                <div className="col-span-1 md:col-span-2 pt-4">
                  <button 
                    type="submit"
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Aluno
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Alunos;
