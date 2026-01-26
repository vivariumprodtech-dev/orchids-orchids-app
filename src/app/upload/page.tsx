"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<"logs" | "foods">("logs");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter(line => line.trim() !== "");
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

      if (type === "logs") {
        for (const row of data) {
          const { error } = await supabase.from("daily_logs").upsert({
            user_id: parseInt(row.user_id),
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
          }, { onConflict: 'user_id,date' });

          if (error) throw error;
        }
      } else {
        for (const row of data) {
          // Get log_id first
          const { data: logData, error: logError } = await supabase
            .from("daily_logs")
            .select("id")
            .eq("user_id", parseInt(row.user_id))
            .eq("date", row.date)
            .single();

          let logId = logData?.id;

          if (logError || !logId) {
            // Create minimal log if not exists
            const { data: newLog, error: createError } = await supabase
              .from("daily_logs")
              .insert({
                user_id: parseInt(row.user_id),
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
            meal: row.meal,
            grams: parseInt(row.grams),
            calories: parseFloat(row.calories),
            protein: parseFloat(row.protein),
            carbs: parseFloat(row.carbs),
            fats: parseFloat(row.fats),
            fiber: parseFloat(row.fiber),
          });

          if (error) throw error;
        }
      }

      setMessage({ text: "Caricamento completato con successo!", type: "success" });
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: `Errore durante il caricamento: ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-800"
        >
          <ArrowLeft size={20} />
          <span>Torna alla Home</span>
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-xl shadow-gray-200/50">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Upload Dati CSV</h1>
            <p className="mt-2 text-gray-500">
              Carica i file CSV per aggiornare i log giornalieri o il dettaglio dei pasti.
            </p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4">
            <button
              onClick={() => setType("logs")}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                type === "logs"
                  ? "border-teal-400 bg-teal-50 text-teal-700"
                  : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
              }`}
            >
              <FileText size={24} />
              <span className="font-bold">Log Giornalieri</span>
            </button>
            <button
              onClick={() => setType("foods")}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                type === "foods"
                  ? "border-purple-400 bg-purple-50 text-purple-700"
                  : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
              }`}
            >
              <Upload size={24} />
              <span className="font-bold">Food Log</span>
            </button>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex cursor-pointer flex-col items-center gap-2"
              >
                <div className="rounded-full bg-white p-3 shadow-sm">
                  <Upload className="text-gray-400" />
                </div>
                {file ? (
                  <span className="font-medium text-gray-900">{file.name}</span>
                ) : (
                  <>
                    <span className="font-medium text-gray-600">Clicca per caricare il file CSV</span>
                    <span className="text-xs text-gray-400">Solo file .csv supportati</span>
                  </>
                )}
              </label>
            </div>

            {message && (
              <div
                className={`flex items-center gap-3 rounded-xl p-4 ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 font-bold text-white transition-all hover:bg-black disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  <span>Elaborazione in corso...</span>
                </>
              ) : (
                <span>Invia Dati</span>
              )}
            </button>
          </div>

          <div className="mt-12 rounded-xl bg-blue-50 p-6">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-blue-900">
              <FileText size={18} />
              Struttura del file CSV ({type === "logs" ? "logs.csv" : "foods.csv"})
            </h3>
            <div className="overflow-x-auto">
              <code className="block whitespace-nowrap rounded-lg bg-white p-3 text-xs text-blue-800 shadow-sm">
                {type === "logs"
                  ? "user_id,date,target_calories,target_protein,target_carbs,target_fats,target_fiber,target_water,target_deficit,calories,protein,carbs,fats,fiber,water,active_calories"
                  : "user_id,date,name,meal,grams,calories,protein,carbs,fats,fiber"}
              </code>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-blue-700">
              {type === "logs"
                ? "Il campo 'user_id' deve essere il ChatID di Telegram. 'target_water' in Litri, 'water' in ml."
                : "Assicurati di caricare prima il file dei log giornalieri o che il giorno esista già."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
