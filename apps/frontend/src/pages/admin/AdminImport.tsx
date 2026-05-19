// apps/frontend/src/pages/admin/AdminImport.tsx
import { useState } from 'react';
import { Upload, FileText, Check, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

interface PreviewRow {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  competition: string | null;
  stadium: string | null;
}

interface ImportResult {
  parsed: number;
  created: number;
  skipped: number;
  errors: Array<{ line: number; reason: string }>;
  preview: PreviewRow[];
}

const SAMPLE = `date,homeTeam,awayTeam,homeScore,awayScore,competition,stadium
2024-12-15,River Plate,Boca Juniors,2,1,Liga Profesional,Monumental
2024-11-20,Racing Club,River Plate,1,3,Liga Profesional,Cilindro de Avellaneda
2024-10-05,River Plate,Independiente,0,0,Liga Profesional,Monumental`;

export default function AdminImport() {
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [committed, setCommitted] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.csv') && !file.type.includes('csv')) {
      setError('Solo se aceptan archivos .csv');
      return;
    }
    const text = await file.text();
    setCsv(text);
  };

  const runPreview = async () => {
    if (!csv.trim()) return;
    setBusy(true);
    setError(null);
    setPreview(null);
    setCommitted(null);
    try {
      const res = await api.post<ImportResult>('/matches/import/csv', { csv, dryRun: true });
      setPreview(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al previsualizar.');
    } finally {
      setBusy(false);
    }
  };

  const runCommit = async () => {
    if (!preview || preview.parsed === 0) return;
    if (!confirm(`¿Importar ${preview.parsed} partidos a la base de datos? Esta acción no se puede deshacer fácilmente.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<ImportResult>('/matches/import/csv', { csv, dryRun: false });
      setCommitted(res.data);
      setPreview(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al importar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-wide uppercase flex items-center gap-2">
          <Upload className="w-6 h-6 text-riverRed" /> Importar partidos (CSV)
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Cargá partidos históricos en bloque desde un archivo CSV. Probá primero con "Previsualizar" antes de confirmar la importación.
        </p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-riverRed mb-2">Formato esperado</p>
          <pre className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-[11px] text-neutral-400 overflow-x-auto">
{SAMPLE}
          </pre>
          <p className="text-[10px] text-neutral-500 mt-2">
            Columnas: <code className="text-riverRed">date,homeTeam,awayTeam,homeScore,awayScore,competition,stadium</code>.
            Si <code>homeScore</code> y <code>awayScore</code> vienen vacíos, el partido se crea como <code>scheduled</code>.
            Si vienen completos, queda como <code>finished</code>. <code>stadium</code> es opcional.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
            CSV
          </label>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={10}
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-2.5 text-sm outline-none font-mono resize-y"
            placeholder="Pegá el contenido del CSV acá…"
          />
          <div className="flex items-center justify-between mt-2 gap-3 flex-wrap">
            <label className="text-xs text-neutral-400 cursor-pointer hover:text-white flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              <span>O subir un archivo .csv</span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = '';
                }}
              />
            </label>
            <button
              onClick={() => setCsv(SAMPLE)}
              type="button"
              className="text-[11px] text-neutral-400 hover:text-white underline"
            >
              Cargar ejemplo
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-800/50 text-red-300 rounded-xl px-4 py-2.5 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={runPreview}
            disabled={busy || !csv.trim()}
            className="bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 border border-neutral-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          >
            {busy && !preview ? 'Procesando…' : 'Previsualizar'}
          </button>
          <button
            onClick={runCommit}
            disabled={busy || !preview || preview.parsed === 0}
            className="bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30"
          >
            {busy && preview ? 'Importando…' : preview ? `Confirmar (${preview.parsed})` : 'Confirmar import'}
          </button>
        </div>
      </div>

      {committed && (
        <div className="bg-green-950/30 border border-green-800/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-green-400" />
            <h3 className="font-bold text-green-300">Importación completada</h3>
          </div>
          <p className="text-sm text-neutral-300">
            Creados: <strong>{committed.created}</strong> · Omitidos: {committed.skipped} · Total: {committed.parsed}
          </p>
          {committed.errors.length > 0 && (
            <ul className="mt-2 text-xs text-yellow-300 space-y-0.5">
              {committed.errors.map((e, i) => (
                <li key={i}>· Línea {e.line}: {e.reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {preview && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="font-bold mb-3 flex items-center justify-between">
            <span>Vista previa ({preview.parsed} filas)</span>
            {preview.errors.length > 0 && (
              <span className="text-xs text-yellow-400 font-normal flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {preview.errors.length} {preview.errors.length === 1 ? 'error' : 'errores'}
              </span>
            )}
          </h3>

          {preview.errors.length > 0 && (
            <div className="bg-yellow-950/30 border border-yellow-800/50 rounded-xl px-4 py-2.5 text-xs text-yellow-300 mb-3">
              <ul className="space-y-0.5 max-h-40 overflow-y-auto">
                {preview.errors.map((e, i) => (
                  <li key={i}>· Línea {e.line}: {e.reason}</li>
                ))}
              </ul>
            </div>
          )}

          {preview.preview.length === 0 ? (
            <p className="text-sm text-neutral-500">Sin filas válidas para importar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold border-b border-neutral-800">
                    <th className="text-left py-2 px-2">Fecha</th>
                    <th className="text-left py-2 px-2">Local</th>
                    <th className="text-center py-2 px-2">Score</th>
                    <th className="text-left py-2 px-2">Visitante</th>
                    <th className="text-left py-2 px-2">Competición</th>
                    <th className="text-left py-2 px-2">Estadio</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((r, i) => (
                    <tr key={i} className="border-b border-neutral-800/50 last:border-0">
                      <td className="py-1.5 px-2 text-neutral-300 tabular-nums">{new Date(r.date).toLocaleDateString('es-AR')}</td>
                      <td className="py-1.5 px-2 text-neutral-200">{r.homeTeam}</td>
                      <td className="py-1.5 px-2 text-center tabular-nums">
                        {r.homeScore != null && r.awayScore != null ? `${r.homeScore}-${r.awayScore}` : <span className="text-neutral-600">—</span>}
                      </td>
                      <td className="py-1.5 px-2 text-neutral-200">{r.awayTeam}</td>
                      <td className="py-1.5 px-2 text-neutral-400">{r.competition ?? '—'}</td>
                      <td className="py-1.5 px-2 text-neutral-500">{r.stadium ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
