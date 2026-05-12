import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Save, 
  BookOpen, 
  Download, 
  History, 
  Trash2, 
  Plus,
  Loader2,
  X,
  Eye,
  EyeOff,
  Printer,
  FileCheck
} from 'lucide-react';
import { 
  generateExam, 
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
  doc
} from 'firebase/firestore';
import { Prova } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';

const CriadorProvas = () => {
  const [formData, setFormData] = useState({
    serie: '',
    tema: '',
    dificuldade: 'Média',
    quantidadeQuestoes: 5,
    tipo: 'Múltipla Escolha'
  });
  
  const [generatedExam, setGeneratedExam] = useState<any>(null);
  const [history, setHistory] = useState<Prova[]>([]);
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState({ canUse: true, remaining: 0 });
  const [showHistory, setShowHistory] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

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
    const q = query(collection(db, 'provas'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prova)));
  };

  const handleGenerate = async () => {
    if (!usage.canUse) {
      alert('Limite de uso atingido.');
      return;
    }
    setLoading(true);
    try {
      const exam = await generateExam(formData);
      setGeneratedExam(exam);
      await incrementIAUsage();
      fetchUsage();
    } catch (err: any) {
      console.error(err);
      if (err.message === "AI_KEY_MISSING") {
        alert('Configuração incompleta: API Key da Gemini não encontrada. Por favor, configure a variável de ambiente VITE_GEMINI_API_KEY.');
      } else {
        alert('Erro ao gerar prova.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedExam || !auth.currentUser) return;
    try {
      await addDoc(collection(db, 'provas'), {
        ...formData,
        questoes: generatedExam.questoes,
        gabarito: generatedExam.gabarito,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      alert('Prova salva!');
      setGeneratedExam(null);
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const exportPDF = (examData: any, includeGabarito = false) => {
    const doc = new jsPDF();
    const questions = examData.questoes;
    
    // Header
    doc.setFontSize(18);
    doc.text("Avaliação de Educação Física", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Escola: __________________________________________________`, 20, 35);
    doc.text(`Aluno(a): ________________________________________________`, 20, 42);
    doc.text(`Série: ${examData.serie} | Turma: ________ | Data: ___/___/___`, 20, 49);
    doc.text(`Tema: ${examData.tema}`, 20, 56);
    doc.line(20, 60, 190, 60);

    let y = 70;
    questions.forEach((q: any, i: number) => {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      const questionText = `${i + 1}) ${q.pergunta}`;
      const lines = doc.splitTextToSize(questionText, 170);
      doc.text(lines, 20, y);
      y += (lines.length * 5) + 5;

      if (q.alternativas) {
        doc.setFont("helvetica", "normal");
        q.alternativas.forEach((alt: string, j: number) => {
          const letter = String.fromCharCode(97 + j);
          doc.text(`(${letter}) ${alt}`, 25, y);
          y += 6;
        });
        y += 4;
      } else {
        // Line for answer
        doc.line(20, y + 10, 190, y + 10);
        y += 15;
      }

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    if (includeGabarito) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text("Gabarito e Orientações", 20, 20);
      doc.setFontSize(11);
      doc.text(doc.splitTextToSize(examData.gabarito, 170), 20, 30);
    }

    const filename = includeGabarito ? `GABARITO_${examData.tema}.pdf` : `PROVA_${examData.tema}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Criador de Provas</h1>
          <p className="text-slate-500">Avaliações profissionais personalizadas para cada série.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-500 border border-slate-200">
            {usage.remaining} RESTANTES
          </div>
          <button onClick={() => setShowHistory(true)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 shadow-sm"><History className="w-6 h-6" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <section className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 h-fit">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Série</label>
            <input type="text" placeholder="Ex: 8º Ano B" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" value={formData.serie} onChange={e => setFormData({...formData, serie: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assunto/Tema</label>
            <input type="text" placeholder="Ex: Anatomia Fisiológica, Práticas Corporais..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" value={formData.tema} onChange={e => setFormData({...formData, tema: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Questões</label>
              <input type="number" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" value={formData.quantidadeQuestoes} onChange={e => setFormData({...formData, quantidadeQuestoes: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dificuldade</label>
              <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" value={formData.dificuldade} onChange={e => setFormData({...formData, dificuldade: e.target.value})}>
                <option>Fácil</option>
                <option>Média</option>
                <option>Difícil</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Prova</label>
            <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
              <option>Múltipla Escolha</option>
              <option>Objetiva (Sim/Não)</option>
              <option>Discursiva (Aberta)</option>
              <option>Verdadeiro ou Falso</option>
            </select>
          </div>
          <button onClick={handleGenerate} disabled={loading || !formData.tema || !formData.serie || !usage.canUse} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 disabled:opacity-50">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
            Gerar Prova Completa
          </button>
        </section>

        {/* Preview */}
        <section className="lg:col-span-2 bg-slate-100 p-1 rounded-3xl min-h-[500px] flex flex-col">
          <div className="bg-white m-1 p-8 rounded-3xl flex-1 border border-white overflow-y-auto max-h-[800px] custom-scrollbar">
            {!generatedExam ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center"><BookOpen className="w-8 h-8" /></div>
                <p className="text-sm font-medium">Sua prova aparecerá aqui após a geração.</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-xl">{formData.tema}</h3>
                    <p className="text-sm text-slate-500">{formData.serie} • {formData.tipo}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAnswers(!showAnswers)} className="p-2 bg-slate-50 text-slate-600 rounded-xl" title="Ver Gabarito">
                      {showAnswers ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button onClick={() => exportPDF(generatedExam)} className="p-2 bg-slate-50 text-indigo-600 rounded-xl" title="PDF Aluno"><Printer className="w-5 h-5" /></button>
                    <button onClick={() => exportPDF(generatedExam, true)} className="p-2 bg-slate-50 text-emerald-600 rounded-xl" title="PDF Gabarito"><FileCheck className="w-5 h-5" /></button>
                    <button onClick={handleSave} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100"><Save className="w-5 h-5" /></button>
                  </div>
                </div>

                <div className="space-y-8">
                  {generatedExam.questoes.map((q: any, i: number) => (
                    <div key={i} className="space-y-3">
                      <p className="font-bold text-slate-800 text-base">{i + 1}. {q.pergunta}</p>
                      {q.alternativas ? (
                        <div className="space-y-2 pl-4">
                          {q.alternativas.map((alt: string, j: number) => (
                            <p key={j} className={`text-sm py-2 px-4 rounded-xl border border-slate-100 ${showAnswers && alt === q.respostaCorreta ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-slate-50 text-slate-600'}`}>
                              {String.fromCharCode(97 + j)}) {alt}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="h-20 border-b border-dashed border-slate-300 mx-4" />
                      )}
                    </div>
                  ))}
                </div>

                {showAnswers && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-2">
                    <h4 className="font-bold text-indigo-800 flex items-center gap-2"><FileCheck className="w-5 h-5" /> Orientações e Gabarito</h4>
                    <p className="text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">{generatedExam.gabarito}</p>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

       {/* Modal Histórico */}
       <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistory(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Histórico de Provas</h2>
                <button onClick={() => setShowHistory(false)} className="text-slate-400"><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.map(item => (
                  <div key={item.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div className="flex justify-between items-start mb-3">
                       <div>
                         <h4 className="font-bold text-slate-800 leading-tight">{item.tema}</h4>
                         <p className="text-xs text-slate-400 font-bold uppercase mt-1">{item.serie} • {item.tipo}</p>
                       </div>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => exportPDF(item, false)} className="p-2 text-indigo-600 hover:bg-white rounded-lg"><Printer className="w-4 h-4" /></button>
                         <button onClick={() => exportPDF(item, true)} className="p-2 text-emerald-600 hover:bg-white rounded-lg"><FileCheck className="w-4 h-4" /></button>
                         <button onClick={() => deleteDoc(doc(db, 'provas', item.id)).then(fetchHistory)} className="p-2 text-red-500 hover:bg-white rounded-lg"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CriadorProvas;
