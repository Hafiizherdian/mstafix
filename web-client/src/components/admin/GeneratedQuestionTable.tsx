'use client'
import React, { useEffect, useState } from "react";
import axios from "axios";

interface GeneratedQuestion {
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
}

export default function GeneratedQuestionTable() {
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      try {
        const res = await axios.get("/api/admin/analytics");
        setQuestions(res.data.generatedQuestions || []);
      } catch (err: any) {
        setError("Gagal mengambil data soal hasil generate");
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  return (
    <div className="bg-zinc-800 rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-cyan-400">Daftar Soal Hasil Generate</h2>
        <button className="btn btn-primary bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded">Tambah Soal</button>
      </div>
      {loading ? (
        <div className="text-center py-6">Memuat data...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-zinc-700 text-cyan-300">
                <th className="py-2 px-3">ID</th>
                <th className="py-2 px-3">Soal</th>
                <th className="py-2 px-3">Kategori</th>
                <th className="py-2 px-3">Tingkat</th>
                <th className="py-2 px-3">Tipe</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {questions.map(q => (
                <tr key={q.id} className="border-b border-zinc-700 hover:bg-zinc-900">
                  <td className="py-2 px-3">{q.id}</td>
                  <td className="py-2 px-3 max-w-xs truncate" title={q.question}>{q.question}</td>
                  <td className="py-2 px-3">{q.category}</td>
                  <td className="py-2 px-3">{q.difficulty}</td>
                  <td className="py-2 px-3">{q.type}</td>
                  <td className="py-2 px-3">{q.status}</td>
                  <td className="py-2 px-3">
                    <button className="text-cyan-400 hover:underline mr-2">Edit</button>
                    <button className="text-red-400 hover:underline">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
