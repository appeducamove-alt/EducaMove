import { Timestamp } from 'firebase/firestore';

export interface Turma {
  id: string;
  nome: string;
  serie: string;
  turno: string;
  observacoes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Aluno {
  id: string;
  nome: string;
  idade: number;
  turmaId: string;
  observacoes: string;
  restricoesFisicas: string;
  responsavel: string;
  telefone: string;
  frequenciaCount: number;
  presencaCount: number;
  notas?: { [key: string]: number };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Frequencia {
  id: string;
  data: Timestamp;
  turmaId: string;
  presencas: {
    [alunoId: string]: {
      status: 'presenca' | 'falta' | 'justificada';
      justificativa?: string;
    };
  };
  createdAt: Timestamp;
}

export interface PlanoAula {
  id: string;
  serie: string;
  tema: string;
  duracao: string;
  quantidadeAlunos: number;
  materiais: string;
  objetivo: string;
  conteudo: {
    objetivoGeral: string;
    aquecimento: string;
    atividadePrincipal: string;
    alongamento: string;
    encerramento: string;
    avaliacao: string;
    habilidadesBNCC: string;
  };
  userId: string;
  createdAt: Timestamp;
}

export interface Prova {
  id: string;
  serie: string;
  tema: string;
  dificuldade: string;
  quantidadeQuestoes: number;
  tipo: string;
  questoes: {
    pergunta: string;
    alternativas?: string[];
    respostaCorreta: string;
  }[];
  gabarito: string;
  userId: string;
  createdAt: Timestamp;
}

export interface Exercicio {
  id: string;
  titulo: string;
  idade: string;
  serie: string;
  objetivo: string;
  espaco: string;
  material: string;
  descricao: string;
  execucao: string;
  materiaisList: string;
  objetivoPedagogico: string;
  favorito: boolean;
  userId: string;
  createdAt: Timestamp;
}

export interface Usage {
  dailyUsage: { [dateStr: string]: number };
  monthlyUsage: { [monthStr: string]: number };
  lastUsed: Timestamp;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}
