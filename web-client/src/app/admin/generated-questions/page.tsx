// Reworked Generated Questions Page - Refactored to use AdminLayout
'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Loader2, ServerCrash, GitBranch, FileText, Calendar } from 'lucide-react';

// --- TypeScript Interface ---
interface GeneratedQuestionData {
  id: string;
  name: string;
  questionCount: number;
  createdAt: string;
}

// --- API Configuration ---
const API_URL = '/api/admin/generated-questions';
const hardcodedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ZDU5Y2U2My1jY2YxLTQzMmEtYmM1Yi0zODVjM2YxYjYxYmIiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MTk1MzI4NzcsImV4cCI6MTcxOTUzMzA1N30.Y_2jH-gROBv5OC3t2s_2l52n-5aE0u2Hwz_ub3v-cK0';

// --- Data Fetching Function ---
async function getGeneratedQuestions(): Promise<GeneratedQuestionData[] | null> {
  try {
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${hardcodedToken}` },
    });
    // The API is expected to return an object like { generatedQuestions: [...] }
    return response.data.generatedQuestions;
  } catch (error) {
    console.error('[getGeneratedQuestions] Failed to fetch data:', error);
    return null;
  }
}

// --- Main Component ---
export default function AdminGeneratedQuestionsPage() {
  const [questions, setQuestions] = useState<GeneratedQuestionData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getGeneratedQuestions().then(data => {
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
        <span className="ml-4 text-xl">Memuat Soal Hasil Generate...</span>
      </div>
    );
  }

  // --- Render Error State ---
  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center h-full">
        <ServerCrash className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Gagal Memuat Data</h2>
        <p className="text-zinc-400">Terjadi kesalahan saat mengambil data dari server.</p>
      </div>
    );
  }

  // --- Render Main Content ---
  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-cyan-400">Kelola Soal Hasil Generate</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GitBranch className="mr-2 h-6 w-6" />
            Daftar Paket Soal Tergenerate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questions && questions.length > 0 ? (
              questions.map((pkg) => (
                <div key={pkg.id} className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                  <div>
                    <p className="font-semibold">{pkg.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-zinc-400 mt-1">
                      <span className="flex items-center"><FileText className="mr-1 h-4 w-4" />{pkg.questionCount} Soal</span>
                      <span className="flex items-center"><Calendar className="mr-1 h-4 w-4" />Dibuat: {new Date(pkg.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-zinc-500">Tidak ada paket soal untuk ditampilkan.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
