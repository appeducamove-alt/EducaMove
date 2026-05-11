import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  doc,
  increment,
  writeBatch
} from 'firebase/firestore';
import { Turma, Aluno, Frequencia } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Save, 
  Search, 
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FrequenciaPage = () => {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [presencas, setPresencas] = useState<{ [alunoId: string]: { status: 'presenca' | 'falta' | 'justificada', justificativa?: string } }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(new Date());

  useEffect(() => {
    const fetchTurmas = async () => {
      const snap = await getDocs(collection(db, 'turmas'));
      setTurmas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Turma)));
    };
    fetchTurmas();
  }, []);

  useEffect(() => {
    if (selectedTurma) {
      const fetchAlunos = async () => {
        setLoading(true);
        const q = query(collection(db, 'alunos'), where('turmaId', '==', selectedTurma.id));
        const snap = await getDocs(q);
        const fetchedAlunos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Aluno));
        setAlunos(fetchedAlunos);
        
        // Initialize with 'presenca' default
        const init: any = {};
        fetchedAlunos.forEach(a => {
          init[a.id] = { status: 'presenca' };
        });
        setPresencas(init);
        setLoading(false);
      };
      fetchAlunos();
    }
  }, [selectedTurma]);

  const handleStatusChange = (alunoId: string, status: 'presenca' | 'falta' | 'justificada') => {
    setPresencas(prev => ({
      ...prev,
      [alunoId]: { ...prev[alunoId], status }
    }));
  };

  const handleJustificativa = (alunoId: string, text: string) => {
    setPresencas(prev => ({
      ...prev,
      [alunoId]: { ...prev[alunoId], justificativa: text }
    }));
  };

  const saveFrequencia = async () => {
    if (!selectedTurma) return;
    setSaving(true);
    try {
      // 1. Save frequency record
      await addDoc(collection(db, 'frequencias'), {
        turmaId: selectedTurma.id,
        data: serverTimestamp(),
        presencas,
        createdAt: serverTimestamp()
      });

      // 2. Update students counts (Atomic Batch)
      const batch = writeBatch(db);
      alunos.forEach(aluno => {
        const docRef = doc(db, 'alunos', aluno.id);
        const status = presencas[aluno.id]?.status;
        batch.update(docRef, {
          frequenciaCount: increment(1),
          presencaCount: status === 'presenca' ? increment(1) : increment(0)
        });
      });
      await batch.commit();

      alert('Chamada salva com sucesso!');
      setSelectedTurma(null);
      setAlunos([]);
      setPresencas({});
    } catch (err) {
      console.error("Erro ao salvar frequência:", err);
      alert('Erro ao salvar chamada.');
    } finally {
      setSaving(false);
    }
  };

  if (!selectedTurma) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Chamada Rápida</h1>
        <p className="text-slate-500 mb-8">Selecione uma turma para iniciar a frequência.</p>
        
        <div className="grid grid-cols-1 gap-4">
          {turmas.map(t => (
            <motion.button 
              key={t.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTurma(t)}
              className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-left"
            >
              <div>
                <h3 className="font-bold text-lg text-slate-800">{t.nome}</h3>
                <p className="text-indigo-600 text-sm font-medium">{t.serie} • {t.turno}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </motion.button>
          ))}
          {turmas.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
              <ClipboardCheck className="w-12 h-12 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400">Nenhuma turma cadastrada.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => setSelectedTurma(null)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">{selectedTurma.nome}</h2>
          <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest">
            {format(data, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="w-10" />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Carregando alunos...</p>
          </div>
        ) : alunos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400">Nenhum aluno nessa turma.</p>
          </div>
        ) : (
          alunos.map((aluno) => (
            <div 
              key={aluno.id}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">{aluno.nome}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleStatusChange(aluno.id, 'presenca')}
                    className={`p-3 rounded-xl transition-all ${presencas[aluno.id]?.status === 'presenca' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-400'}`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleStatusChange(aluno.id, 'falta')}
                    className={`p-3 rounded-xl transition-all ${presencas[aluno.id]?.status === 'falta' ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-slate-50 text-slate-400'}`}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleStatusChange(aluno.id, 'justificada')}
                    className={`p-3 rounded-xl transition-all ${presencas[aluno.id]?.status === 'justificada' ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-slate-50 text-slate-400'}`}
                  >
                    <AlertCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {presencas[aluno.id]?.status === 'justificada' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <input 
                      type="text" 
                      placeholder="Motivo da justificativa..."
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                      onChange={(e) => handleJustificativa(aluno.id, e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 lg:static lg:bg-transparent lg:border-none lg:p-0 lg:mt-8">
        <button 
          onClick={saveFrequencia}
          disabled={saving || alunos.length === 0}
          className="w-full max-w-2xl mx-auto py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
          Finalizar Chamada
        </button>
      </div>
    </div>
  );
};

export default FrequenciaPage;
