'use client'
import React, { useEffect, useState } from "react";
import axios from "axios";

interface Question {
  id: string;
  question: string;
  answer: string;
  options?: Record<string, string>;
  explanation?: string;
  category: string;
  difficulty?: string;
  type?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export default function QuestionTable() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      try {
        const res = await axios.get("/api/admin/analytics");
        setQuestions(res.data.questions || []);
      } catch (err: any) {
        setError("Gagal mengambil data soal");
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  return (
    <div className="bg-zinc-800 rounded-lg shadow-lg p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-lg sm:text-xl font-semibold text-cyan-400">Daftar Soal</h2>
        <button className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base transition-colors">
          Tambah Soal
        </button>
      </div>
      {loading ? (
        <div className="text-center py-6">Memuat data...</div>
      ) : error ? (
        <div className="text-red-400 p-4">{error}</div>
      ) : (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden border border-zinc-700 rounded-lg">
              <table className="min-w-full divide-y divide-zinc-700">
                <thead className="bg-zinc-700">
                  <tr>
                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider">
                      Soal
                    </th>
                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider hidden sm:table-cell">
                      Kategori
                    </th>
                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider hidden md:table-cell">
                      Tingkat
                    </th>
                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider hidden lg:table-cell">
                      Tipe
                    </th>
                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-800 divide-y divide-zinc-700">
                  {questions.map((q) => (
                    <tr key={q.id} className="hover:bg-zinc-900/50">
                      <td className="px-2 sm:px-3 py-3 whitespace-normal max-w-[200px] sm:max-w-xs">
                        <div className="text-xs sm:text-sm font-medium text-white">
                          {q.question}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-700 text-zinc-200">
                            {q.category}
                          </span>
                          {q.difficulty && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/20 text-cyan-300">
                              {q.difficulty}
                            </span>
                          )}
                          {q.type && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300">
                              {q.type}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-3 whitespace-nowrap text-xs sm:text-sm text-zinc-300 hidden sm:table-cell">
                        {q.category}
                      </td>
                      <td className="px-2 sm:px-3 py-3 whitespace-nowrap text-xs sm:text-sm text-zinc-300 hidden md:table-cell">
                        {q.difficulty}
                      </td>
                      <td className="px-2 sm:px-3 py-3 whitespace-nowrap text-xs sm:text-sm text-zinc-300 hidden lg:table-cell">
                        {q.type}
                      </td>
                      <td className="px-2 sm:px-3 py-3 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <div className="flex space-x-1 sm:space-x-2">
                          <button className="text-cyan-400 hover:text-cyan-300 transition-colors p-1 sm:p-1.5">
                            <span className="sr-only">Edit</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button className="text-red-400 hover:text-red-300 transition-colors p-1 sm:p-1.5">
                            <span className="sr-only">Hapus</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
