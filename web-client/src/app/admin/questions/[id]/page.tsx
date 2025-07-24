'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, ServerCrash, Trash2, PlusCircle } from 'lucide-react';
import { AxiosResponse } from 'axios';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import apiClient from '@/lib/apiClient';

// --- Zod Schema for Validation ---
const questionSchema = z.object({
  content: z.string().min(10, 'Konten soal minimal 10 karakter'),
  category: z.string().min(3, 'Kategori minimal 3 karakter'),
  difficulty: z.enum(['MUDAH', 'SEDANG', 'SULIT']),
  options: z.array(z.object({ text: z.string().min(1, 'Opsi tidak boleh kosong') })).min(2, 'Minimal 2 opsi'),
  correctAnswerIndex: z.number().min(0),
});

type QuestionFormData = z.infer<typeof questionSchema>;

// --- Data Transformation ---
const transformApiToFormData = (apiData: any): QuestionFormData => {
  const optionEntries = apiData.options ? Object.entries(apiData.options) : [];
  const options = optionEntries.map(([_, value]) => ({ text: value as string }));
  const correctAnswerIndex = optionEntries.findIndex(([key]) => key === apiData.answer);

  const mapDifficulty = (difficulty: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY': return 'MUDAH';
      case 'MEDIUM': return 'SEDANG';
      case 'HARD': return 'SULIT';
      default: return 'SEDANG';
    }
  };

  return {
    content: apiData.question || '',
    category: apiData.category || '',
    difficulty: mapDifficulty(apiData.difficulty),
    options: options.length > 0 ? options : [{ text: '' }, { text: '' }],
    correctAnswerIndex: correctAnswerIndex !== -1 ? correctAnswerIndex : 0,
  };
};

const transformFormDataToApi = (formData: QuestionFormData) => {
  const optionsObject = formData.options.reduce((acc, option, index) => {
    const key = String.fromCharCode(65 + index);
    acc[key] = option.text;
    return acc;
  }, {} as Record<string, string>);

  const answerKey = String.fromCharCode(65 + formData.correctAnswerIndex);

  const mapDifficultyToApi = (difficulty: string) => {
    switch (difficulty) {
      case 'MUDAH': return 'EASY';
      case 'SEDANG': return 'MEDIUM';
      case 'SULIT': return 'HARD';
      default: return 'MEDIUM';
    }
  };

  return {
    question: formData.content,
    category: formData.category,
    difficulty: mapDifficultyToApi(formData.difficulty),
    options: optionsObject,
    answer: answerKey,
    type: 'MCQ', // Assuming type is always MCQ for this form
  };
};


// --- Main Component ---
export default function QuestionFormPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const isEditMode = id !== 'new';
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      difficulty: 'SEDANG',
      options: [{ text: '' }, { text: '' }],
      correctAnswerIndex: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      apiClient.get(`/admin/questions/${id}`)
        .then((response: AxiosResponse) => {
          const transformedData = transformApiToFormData(response.data.data);
          console.log('[DEBUG] Data transformed for form:', transformedData);
          reset(transformedData);
        })
        .catch((err: any) => {
          console.error('Failed to fetch question:', err);
          setError('Gagal memuat data soal. Mungkin soal tidak ditemukan.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode, reset]);

  const onSubmit = async (data: QuestionFormData) => {
    const apiData = transformFormDataToApi(data);

    const promise = isEditMode
      ? apiClient.put(`/admin/questions/${id}`, apiData)
      : apiClient.post('/admin/questions', apiData);

    toast.promise(promise, {
      loading: `Menyimpan soal...`,
      success: () => {
        router.push('/admin/questions');
        return `Soal berhasil ${isEditMode ? 'diperbarui' : 'dibuat'}!`
      },
      error: `Gagal menyimpan soal.`,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        <span className="ml-4 text-xl">Memuat Formulir Soal...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-[60vh]">
        <ServerCrash className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Gagal Memuat Data</h2>
        <p className="text-zinc-400 mb-6">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <Button variant="ghost" onClick={() => router.push('/admin/questions')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Bank Soal
        </Button>
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-white">
          {isEditMode ? 'Edit Soal' : 'Buat Soal Baru'}
        </h1>
        <p className="text-zinc-400 mt-2">
          Isi detail soal pada formulir di bawah ini.
        </p>
      </div>

      {/* Form Container */}
      <div className="max-w-2xl mx-auto bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-xl p-4 sm:p-8 space-y-8 mt-6 mb-10 transition-all duration-300">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Konten Soal */}
          <div>
            <Label htmlFor="content">Konten Soal</Label>
            <Textarea id="content" {...register('content')} className="mt-1" rows={5} />
            {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>}
          </div>

          {/* Kategori & Kesulitan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="category">Kategori</Label>
              <Input id="category" {...register('category')} className="mt-1" />
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <Label>Tingkat Kesulitan</Label>
              <Controller
                name="difficulty"
                control={control}
                render={({ field }: { field: any }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MUDAH">Mudah</SelectItem>
                      <SelectItem value="SEDANG">Sedang</SelectItem>
                      <SelectItem value="SULIT">Sulit</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Opsi Jawaban */}
          <div>
            <Label>Opsi Jawaban</Label>
            <p className="text-sm text-zinc-400 mb-4">Tambahkan opsi dan pilih salah satu sebagai jawaban yang benar.</p>
            <div className="space-y-4">
              <Controller
                name="correctAnswerIndex"
                control={control}
                render={({ field: radioField }: { field: any }) => (
                  <div className="space-y-3">
                    {fields.map((item, index) => (
  <div
    key={item.id}
    className="flex items-center gap-3 p-4 bg-zinc-800/80 rounded-xl border border-zinc-700 shadow-sm hover:shadow-lg transition-shadow duration-200 ease-in-out group"
  >
    <div className="flex items-center justify-center">
      <input
        type="radio"
        {...radioField}
        onChange={() => radioField.onChange(index)}
        checked={radioField.value === index}
        className="form-radio h-5 w-5 text-cyan-500 bg-zinc-700 border-zinc-600 focus:ring-cyan-600 focus:ring-offset-zinc-800 transition-colors duration-150"
      />
    </div>
    <Input
      {...register(`options.${index}.text`)}
      placeholder={`Opsi ${index + 1}`}
      className="flex-grow bg-zinc-900/60 border-zinc-700 text-zinc-100 placeholder-zinc-400 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg px-4 py-2 text-base shadow-inner transition-all duration-150"
    />
    <Button
      type="button"
      variant="destructive"
      size="icon"
      onClick={() => remove(index)}
      disabled={fields.length <= 2}
      className="ml-2 opacity-80 group-hover:opacity-100 transition-opacity duration-200"
      title="Hapus Opsi"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
))}
                  </div>
                )}
              />
               {errors.options && <p className="text-red-500 text-sm mt-2">{errors.options.message || errors.options.root?.message}</p>}
            </div>
            <Button type="button" variant="outline" onClick={() => append({ text: '' })} className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Opsi
            </Button>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isEditMode ? 'Simpan Perubahan' : 'Simpan Soal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
