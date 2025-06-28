// Reworked Question Management Page - Refactored to use AdminLayout
'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Loader2, ServerCrash, HelpCircle, List, Tag, Type } from 'lucide-react';

// --- TypeScript Interface ---
interface QuestionData {
  id: string;
  question: string;
  category: string;
  difficulty: 'MUDAH' | 'SEDANG' | 'SULIT';
  type: 'PILIHAN_GANDA' | 'ISIAN_SINGKAT';
  createdAt: string;
}

// --- API Configuration ---
const API_QUESTIONS_URL = '/api/admin/questions';
const hardcodedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ZDU5Y2U2My1jY2YxLTQzMmEtYmM1Yi0zODVjM2YxYjYxYmIiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MTk1MzI4NzcsImV4cCI6MTcxOTUzMzA1N30.Y_2jH-gROBv5OC3t2s_2l52n-5aE0u2Hwz_ub3v-cK0';

// --- Data Fetching Function ---
async function getQuestions(): Promise<QuestionData[] | null> {
  try {
    const response = await axios.get(API_QUESTIONS_URL, {
      headers: { Authorization: `Bearer ${hardcodedToken}` },
    });
    // The API is expected to return an object like { questions: [...] }
    return response.data.questions;
  } catch (error) {
    console.error('[getQuestions] Failed to fetch questions:', error);
    return null;
  }
}

// --- Main Component ---
export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<QuestionData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getQuestions().then(data => {
      if (data) {
        setQuestions(data);
      } else {
        setError(true);
      }
      setLoading(false);
    });
  }, []);

  // --- Render Loading State ---
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        <span className="ml-4 text-xl">Memuat Data Bank Soal...</span>
      </div>
    );
  }

  // --- Render Error State ---
  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center h-full">
        <ServerCrash className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Gagal Memuat Bank Soal</h2>
        <p className="text-zinc-400">Terjadi kesalahan saat mengambil data dari server.</p>
      </div>
    );
  }

  // --- Render Main Content ---
  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-cyan-400">Kelola Bank Soal</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <List className="mr-2 h-6 w-6" />
            Daftar Soal di Bank Soal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questions && questions.length > 0 ? (
              questions.map((question) => (
                <div key={question.id} className="p-4 bg-zinc-800 rounded-lg">
                  <p className="font-semibold mb-2">{question.question}</p>
                  <div className="flex items-center space-x-4 text-sm text-zinc-400">
                    <span className="flex items-center"><Tag className="mr-1 h-4 w-4" /> {question.category}</span>
                    <span className="flex items-center"><HelpCircle className="mr-1 h-4 w-4" /> {question.difficulty}</span>
                    <span className="flex items-center"><Type className="mr-1 h-4 w-4" /> {question.type}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-zinc-500">Tidak ada soal untuk ditampilkan.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
