"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, BarChart3, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const GenerativeMaterials = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // --- الرابط العام لسيرفر الـ AI على Render ---
  const API_URL = "https://mofsai-platform-8.onrender.com/predict";

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // إعادة ضبط الحالات عند رفع ملف جديد
    setFileName(file.name);
    setLoading(true);
    setError(null);
    setData([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;

      try {
        // إرسال البيانات مباشرة لسيرفر راندر (وليس لمسار داخلي)
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ csv_text: text }),
        });

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status === "success" && result.generated_materials) {
          setData(result.generated_materials);
        } else {
          setError(result.error || "The AI model couldn't process this file.");
        }
      } catch (err: any) {
        console.error("Connection Error:", err);
        setError("Could not connect to the AI server. Please make sure Render is active.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-3xl text-white shadow-2xl overflow-hidden relative">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Generative MOF Design</h1>
          <p className="text-slate-300">Upload structural data to predict material performance using AI</p>
        </div>

        <div className="relative z-10">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-all active:scale-95 shadow-lg">
              <span>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
                {loading ? "AI is Analyzing..." : "Upload CSV Data"}
              </span>
            </Button>
          </label>
        </div>
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      </div>

      {/* Status Indicators */}
      {fileName && !error && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold bg-emerald-50 w-fit px-4 py-2 rounded-full border border-emerald-100">
          <CheckCircle2 className="h-4 w-4" />
          Ready: {fileName}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 font-semibold bg-red-50 w-fit px-4 py-2 rounded-full border border-red-100">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Analytics Chart */}
        <Card className="lg:col-span-2 shadow-xl border-none bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Predicted Performance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[450px] p-6">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="predicted_score" radius={[6, 6, 0, 0]} barSize={40}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#2563eb' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <div className="p-4 bg-white rounded-full shadow-sm">
                  <BarChart3 className="h-8 w-8 text-slate-300" />
                </div>
                <p className="font-medium">Waiting for data upload...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rankings Sidebar */}
        <Card className="shadow-xl border-none bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="text-lg font-bold text-slate-800">Top Candidates</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {data.length > 0 ? (
                data.slice(0, 8).map((item, idx) => (
                  <div key={idx} className="group flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                        idx < 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right">
                       <span className="text-blue-600 font-black text-sm">{item.predicted_score}</span>
                       <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Score</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="mb-4 flex justify-center text-slate-200">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <p className="text-slate-400 text-sm">No materials processed yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenerativeMaterials;