"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, BarChart3, Loader2, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const GenerativeMaterials = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");

  // --- الرابط الجديد الخاص بك على Render ---
  const API_URL = "https://mofsai-platform-8.onrender.com/predict";

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csv_text: text }),
        });

        const result = await response.json();

        if (result.status === "success") {
          // تحديث البيانات لعرضها في الرسوم البيانية والبطاقات
          setData(result.generated_materials);
        } else {
          alert("Error: " + (result.error || "Failed to process data"));
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Could not connect to the AI server. Make sure Render is awake!");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-2xl text-white shadow-xl">
        <div>
          <h1 className="text-3xl font-bold mb-2">Generative MOF Design</h1>
          <p className="text-slate-400">Upload your structural data to predict performance scores</p>
        </div>
        <div className="relative">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <Button asChild variant="secondary" className="cursor-pointer hover:scale-105 transition-transform">
              <span>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {loading ? "Processing AI Model..." : "Upload CSV Data"}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {fileName && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium animate-pulse">
          <CheckCircle2 className="h-4 w-4" />
          Active File: {fileName}
        </div>
      )}

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Card */}
        <Card className="lg:col-span-2 shadow-md border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Predicted Performance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="predicted_score" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#2563eb' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 border-2 border-dashed rounded-xl">
                Upload data to see visual analysis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performers List */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Top Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.length > 0 ? (
                data.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-blue-600 font-bold">{item.predicted_score}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">No results yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenerativeMaterials;