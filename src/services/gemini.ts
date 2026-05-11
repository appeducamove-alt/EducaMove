import { GoogleGenAI, Type } from "@google/genai";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, increment, Timestamp } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function checkIAUsage(): Promise<{ canUse: boolean; remaining: number }> {
  if (!auth.currentUser) return { canUse: false, remaining: 0 };
  
  const userId = auth.currentUser.uid;
  const usageRef = doc(db, "usage", userId);
  const usageDoc = await getDoc(usageRef);
  
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const monthStr = `${now.getFullYear()}-${now.getMonth() + 1}`;
  
  const dailyLimit = 10;
  const monthlyLimit = 50;
  
  if (!usageDoc.exists()) {
    await setDoc(usageRef, {
      dailyUsage: { [dateStr]: 0 },
      monthlyUsage: { [monthStr]: 0 },
      lastUsed: Timestamp.now()
    });
    return { canUse: true, remaining: dailyLimit };
  }
  
  const data = usageDoc.data();
  const dailyCount = data.dailyUsage?.[dateStr] || 0;
  const monthlyCount = data.monthlyUsage?.[monthStr] || 0;
  
  const dailyRemaining = dailyLimit - dailyCount;
  const monthlyRemaining = monthlyLimit - monthlyCount;
  
  const canUse = dailyRemaining > 0 && monthlyRemaining > 0;
  const remaining = Math.min(dailyRemaining, monthlyRemaining);
  
  return { canUse, remaining };
}

export async function incrementIAUsage() {
  if (!auth.currentUser) return;
  
  const userId = auth.currentUser.uid;
  const usageRef = doc(db, "usage", userId);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const monthStr = `${now.getFullYear()}-${now.getMonth() + 1}`;
  
  await updateDoc(usageRef, {
    [`dailyUsage.${dateStr}`]: increment(1),
    [`monthlyUsage.${monthStr}`]: increment(1),
    lastUsed: Timestamp.now()
  });
}

export async function generateLessonPlan(params: any) {
  const model = "gemini-3-flash-preview";
  const prompt = `Gere um plano de aula de Educação Física com base nos seguintes dados:
  Série: ${params.serie}
  Tema: ${params.tema}
  Duração: ${params.duracao}
  Quantidade de Alunos: ${params.quantidadeAlunos}
  Materiais Disponíveis: ${params.materiais}
  Objetivo da Aula: ${params.objetivo}
  
  O retorno deve ser em JSON seguindo esta estrutura:
  {
    "objetivoGeral": "string",
    "aquecimento": "string",
    "atividadePrincipal": "string",
    "alongamento": "string",
    "encerramento": "string",
    "avaliacao": "string",
    "habilidadesBNCC": "string"
  }`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateExam(params: any) {
  const model = "gemini-3-flash-preview";
  const prompt = `Gere uma prova de Educação Física com base nos seguintes dados:
  Série: ${params.serie}
  Tema: ${params.tema}
  Dificuldade: ${params.dificuldade}
  Quantidade de Questões: ${params.quantidadeQuestoes}
  Tipo da Prova: ${params.tipo}
  
  O retorno deve ser em JSON seguindo esta estrutura:
  {
    "questoes": [
      {
        "pergunta": "string",
        "alternativas": ["string", "string", "string", "string"], // apenas se for múltipla escolha ou objetiva
        "respostaCorreta": "string"
      }
    ],
    "gabarito": "Resumo detalhado das respostas corretas e critérios de avaliação."
  }`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateExercise(params: any) {
  const model = "gemini-3-flash-preview";
  const prompt = `Sugira uma atividade ou exercício de Educação Física com base nos seguintes filtros:
  Idade: ${params.idade}
  Série: ${params.serie}
  Objetivo: ${params.objetivo}
  Espaço: ${params.espaco}
  Material: ${params.material}
  
  O retorno deve ser em JSON seguindo esta estrutura:
  {
    "titulo": "string",
    "descricao": "string",
    "execucao": "string",
    "materiaisList": "string",
    "objetivoPedagogico": "string"
  }`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || "{}");
}
