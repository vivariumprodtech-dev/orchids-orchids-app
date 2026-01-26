"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<"logs" | "foods">("logs");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter(line => line.trim() !== "");
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      return headers.reduce((obj: any, header, i) => {
        obj[header] = values[i];
        return obj;
      }, {});
    });
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setMessage(null);

    try {
      const text = await file.text();
      const data = parseCSV(text);

      if (data.length === 0) {
        throw new Error("Il file CSV sembra vuoto o malformato.");
      }

        if (type === "logs") {
          for (const row of data) {
            if (!row.user_id || !row.date) continue;
            
            const { error } = await supabase.from("daily_logs").upsert({
              user_id: row.user_id,
              date: row.date,
            target_calories: row.target_calories ? parseInt(row.target_calories) : null,
            target_protein: row.target_protein ? parseFloat(row.target_protein) : null,
            target_carbs: row.target_carbs ? parseFloat(row.target_carbs) : null,
            target_fats: row.target_fats ? parseFloat(row.target_fats) : null,
            target_fiber: row.target_fiber ? parseFloat(row.target_fiber) : null,
            target_water: row.target_water ? parseFloat(row.target_water) : null,
            target_deficit: row.target_deficit ? parseInt(row.target_deficit) : null,
            calories: row.calories ? parseFloat(row.calories) : 0,
            protein: row.protein ? parseFloat(row.protein) : 0,
            carbs: row.carbs ? parseFloat(row.carbs) : 0,
            fats: row.fats ? parseFloat(row.fats) : 0,
            fiber: row.fiber ? parseFloat(row.fiber) : 0,
            water: row.water ? parseInt(row.water) : 0,
            active_calories: row.active_calories ? parseFloat(row.active_calories) : 0,
            bmr: row.bmr ? parseFloat(row.bmr) : null,
            alcohol: row.alcohol ? parseFloat(row.alcohol) : 0,
          }, { onConflict: 'user_id,date' });

          if (error) throw error;
        }
      } else {
        for (const row of data) {
          if (!row.user_id || !row.date || !row.name) continue;

          // Get or create log_id
          const { data: logData, error: logError } = await supabase
            .from("daily_logs")
            .select("id")
            .eq("user_id", row.user_id)
            .eq("date", row.date)
            .maybeSingle();

          let logId = logData?.id;

          if (!logId) {
            const { data: newLog, error: createError } = await supabase
              .from("daily_logs")
              .insert({
                user_id: row.user_id,
                date: row.date,
              })
              .select("id")
              .single();
            
            if (createError) throw createError;
            logId = newLog.id;
          }

            const { error } = await supabase.from("food_entries").insert({
              log_id: logId,
              name: row.name,
              meal: row.meal || "Spuntino",
              grams: row.grams ? parseInt(row.grams) : 0,
              calories: row.calories ? parseFloat(row.calories) : 0,
              protein: row.protein ? parseFloat(row.protein) : 0,
              carbs: row.carbs ? parseFloat(row.carbs) : 0,
              fats: row.fats ? parseFloat(row.fats) : 0,
              fiber: row.fiber ? parseFloat(row.fiber) : 0,
              alcohol: row.alcohol ? parseFloat(row.alcohol) : 0,
            });


          if (error) throw error;
        }
      }

      setMessage({ text: `Successo! ${data.length} righe elaborate.`, type: "success" });
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: `Errore: ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-gray-50 to-white p-4 md:p-8">
      <div className="w-full max-w-3xl">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-gray-400 transition-colors hover:text-teal-600"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Torna alla Dashboard</span>
        </Link>

        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-gray-200/50 border border-gray-100">
          <div className="bg-teal-500 p-8 text-white">
            <h1 className="text-3xl font-bold">Importazione Dati CSV</h1>
            <p className="mt-2 text-teal-50 opacity-90">
              Aggiorna massivamente i profili di Alex, Camila o altri utenti.
            </p>
          </div>

          <div className="p-8">
            <div className="mb-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setType("logs")}
                className={`flex flex-1 items-center justify-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                  type === "logs"
                    ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm"
                    : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                }`}
              >
                <FileText size={20} />
                <div className="text-left">
                  <p className="font-bold leading-tight">Obiettivi e Totali</p>
                  <p className="text-xs opacity-70">Daily targets, active kcal...</p>
                </div>
              </button>
              <button
                onClick={() => setType("foods")}
                className={`flex flex-1 items-center justify-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                  type === "foods"
                    ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm"
                    : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                }`}
              >
                <Upload size={20} />
                <div className="text-left">
                  <p className="font-bold leading-tight">Dettaglio Pasti</p>
                  <p className="text-xs opacity-70">Singoli alimenti e grammature</p>
                </div>
              </button>
            </div>

            <div className="space-y-6">
              <div 
                className={`group relative rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                  file ? "border-teal-400 bg-teal-50/30" : "border-gray-200 bg-gray-50 hover:border-teal-300"
                }`}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  id="csv-upload"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className={`rounded-full p-4 shadow-sm transition-transform group-hover:scale-110 ${file ? "bg-teal-500 text-white" : "bg-white text-gray-400"}`}>
                    <Upload size={28} />
                  </div>
                  {file ? (
                    <div>
                      <span className="block font-bold text-gray-900">{file.name}</span>
                      <span className="text-xs text-teal-600">File pronto per l'invio</span>
                    </div>
                  ) : (
                    <div>
                      <span className="block font-bold text-gray-700">Trascina qui il file CSV</span>
                      <span className="text-xs text-gray-400">O clicca per sfogliare i tuoi file</span>
                    </div>
                  )}
                </div>
              </div>

              {message && (
                <div
                  className={`flex items-start gap-3 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-100"
                      : "bg-red-50 text-red-700 border border-red-100"
                  }`}
                >
                  {message.type === "success" ? <CheckCircle2 className="mt-0.5" size={18} /> : <AlertCircle className="mt-0.5" size={18} />}
                  <span className="text-sm font-semibold">{message.text}</span>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gray-900 py-5 font-bold text-white transition-all hover:bg-black disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    <span>Elaborazione...</span>
                  </>
                ) : (
                  <>
                    <span>Carica Dati Ora</span>
                    <ArrowLeft size={18} className="rotate-180 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>

            <div className="mt-12 space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                <Info size={20} className="text-teal-500" />
                Guida al Formato CSV
              </h3>
              
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
                <p className="mb-4 text-sm font-medium text-gray-600">
                  Struttura delle colonne per <span className="text-teal-600 font-bold">{type === "logs" ? "Obiettivi e Totali" : "Dettaglio Pasti"}</span>:
                </p>
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-4">
                  <code className="whitespace-nowrap text-xs font-mono text-teal-800">
                    {type === "logs"
                      ? "user_id,date,target_calories,target_protein,target_carbs,target_fats,target_fiber,target_water,target_deficit,calories,protein,carbs,fats,fiber,water,active_calories,bmr,alcohol"
                      : "user_id,date,name,meal,grams,calories,protein,carbs,fats,fiber"}
                  </code>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                  <div className="space-y-2">
                    <p><strong className="text-gray-700">user_id:</strong> Il ChatID di Telegram (es: 6217569048)</p>
                    <p><strong className="text-gray-700">date:</strong> Formato YYYY-MM-DD (es: 2026-01-26)</p>
                    <p><strong className="text-gray-700">bmr:</strong> Kcal metabolismo basale (facoltativo)</p>
                    <p><strong className="text-gray-700">water:</strong> ml di acqua assunta</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong className="text-gray-700">alcohol:</strong> Grammi di alcool assunti</p>
                    <p><strong className="text-gray-700">meal:</strong> Colazione, Pranzo, Cena, Spuntino</p>
                    <p><strong className="text-gray-700">calories:</strong> Kcal totali o del singolo alimento</p>
                    <p><strong className="text-gray-700">Importante:</strong> Usa la virgola come separatore.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
