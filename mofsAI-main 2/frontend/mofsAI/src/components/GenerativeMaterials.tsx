'use client';

import React, { useMemo, useState } from 'react';
import Button from './common/Button';
// استيراد مكتبة الرسوم البيانية
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const LOCAL_API_URL = 'http://127.0.0.1:10000/predict';

export default function GenerativeMaterials() {
  const [csvText, setCsvText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ''));
      setResult(null);
      setError(null);
    };
    reader.readAsText(f);
  };

  const generated = result?.generated_materials ?? [];

  // تحضير البيانات للرسم البياني (أفضل 10 نتائج)
  const chartData = useMemo(() => {
    return generated.slice(0, 10).map((m: any) => ({
      name: `Material ${m.rank}`,
      score: m.predicted_score,
    }));
  }, [generated]);

  const generate = async () => {
    if (!csvText) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(LOCAL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_text: csvText, n_generate: 200, top_k: 10 }),
      });

      if (!response.ok) throw new Error('فشل الاتصال بسيرفر البايثون');
      const res = await response.json();
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* قسم رفع الملف */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">MOFs Discovery Dashboard</h2>
        <p className="text-sm text-slate-600 mb-4">ارفيع بيانات المواد الخام بصيغة CSV للحصول على تحليل ذكي.</p>

        <input
          type="file"
          accept=".csv"
          onChange={onFileChange}
          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-semibold hover:file:bg-blue-700 cursor-pointer"
        />

        <div className="mt-4">
          <Button type="button" onClick={generate} disabled={!csvText || loading}>
            {loading ? 'جاري التحليل...' : 'بدء التوقع (Predict)'}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">⚠️ {error}</p>}
      </div>

      {/* --- قسم الرسم البياني الجديد --- */}
      {generated.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">مقارنة أداء أفضل 10 مواد متوقعة</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#1d4ed8' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* قسم البطاقات التفصيلية */}
      {generated.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {generated.slice(0, 6).map((m: any) => (
            <div key={m.rank} className="rounded-lg border border-slate-200 bg-slate-50 p-4 hover:border-blue-300 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded">الترتيب {m.rank}</span>
                <span className="text-sm font-bold text-slate-900">{m.predicted_score?.toFixed(4)}</span>
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                {Object.entries(m.features).slice(0, 5).map(([k, v]: any) => (
                  <div key={k} className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="font-mono">{k}</span>
                    <span className="text-slate-900">{typeof v === 'number' ? v.toFixed(3) : String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}