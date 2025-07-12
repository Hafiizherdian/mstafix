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
    <div className="bg-zinc-800/95 rounded-xl shadow-lg shadow-zinc-900/30 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-cyan-400 tracking-wide">Daftar Soal</h2>
        <button className="w-full sm:w-auto bg-cyan-500/80 hover:bg-cyan-600/90 hover:scale-105 text-white px-4 sm:px-6 py-2.5 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 ease-in-out shadow-sm">
          Tambah Soal
        </button>
      </div>
      {loading ? (
        <div className="text-center py-8 text-zinc-300">Memuat data...</div>
      ) : error ? (
        <div className="text-red-400 p-6 text-center bg-zinc-700/30 rounded-lg">{error}</div>
      ) : (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden border border-zinc-700/50 rounded-lg shadow-md shadow-zinc-900/20">
              <table className="min-w-full divide-y divide-zinc-700/50">
                <thead className="bg-zinc-700/80 backdrop-blur-sm">
                  <tr>
                    <th scope="col" className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider">
                      Soal
                    </th>
                    <th scope="col" className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider hidden sm:table-cell">
                      Kategori
                    </th>
                    <th scope="col" className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider hidden md:table-cell">
                      Tingkat
                    </th>
                    <th scope="col" className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider hidden lg:table-cell">
                      Tipe
                    </th>
                    <th scope="col" className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-cyan-300 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-800/90 divide-y divide-zinc-700/50">
                  {questions.map((q) => (
                    <tr key={q.id} className="hover:bg-zinc-900/60 transition-colors duration-300 ease-in-out">
                      <td className="px-3 sm:px-4 py-4 whitespace-normal max-w-[200px] sm:max-w-xs">
                        <div className="text-sm font-medium text-white leading-relaxed">
                          {q.question}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5 sm:hidden">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-700/60 text-zinc-200 shadow-sm shadow-zinc-900/30">
                            {q.category}
                          </span>
                          {q.difficulty && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 shadow-sm shadow-zinc-900/30">
                              {q.difficulty}
                            </span>
                          )}
                          {q.type && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 shadow-sm shadow-zinc-900/30">
                              {q.type}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-sm text-zinc-300 hidden sm:table-cell">
                        {q.category}
                      </td>
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-sm text-zinc-300 hidden md:table-cell">
                        {q.difficulty || '-'}
                      </td>
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-sm text-zinc-300 hidden lg:table-cell">
                        {q.type || '-'}
                      </td>
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600/80 hover:bg-cyan-700/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 ease-in-out">
                          Edit
                        </button>
                        <button className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600/80 hover:bg-red-700/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 ease-in-out">
                          Hapus
                        </button>
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
