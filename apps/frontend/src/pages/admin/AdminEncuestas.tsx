import { useEffect, useState } from 'react';
import { Plus, X, Trash2, Lock } from 'lucide-react';
import {
  getAllSurveys,
  createSurvey,
  closeSurvey,
  deleteSurvey,
  getSurveyResults,
} from '../../services/surveys.service';
import type { SurveySummary, SurveyResult } from '../../services/surveys.service';

export default function AdminEncuestas() {
  const [surveys, setSurveys] = useState<SurveySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<{ msg: string; error: boolean } | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [optionLabels, setOptionLabels] = useState(['', '']);
  const [creating, setCreating] = useState(false);

  // Results modal
  const [viewResult, setViewResult] = useState<SurveyResult | null>(null);

  const showFlash = (msg: string, error = false) => {
    setFlash({ msg, error });
    setTimeout(() => setFlash(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      setSurveys(await getAllSurveys());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = optionLabels.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) {
      showFlash('Se requiere pregunta y al menos 2 opciones.', true);
      return;
    }
    setCreating(true);
    try {
      await createSurvey({
        question: question.trim(),
        options: validOptions.map((label, i) => ({ id: `opt_${i + 1}`, label: label.trim() })),
      });
      showFlash('✅ Encuesta creada.');
      setQuestion('');
      setOptionLabels(['', '']);
      setShowCreate(false);
      await load();
    } catch {
      showFlash('Error al crear la encuesta.', true);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = async (id: string) => {
    if (!confirm('¿Cerrar esta encuesta? No se podrá reabrir.')) return;
    try {
      await closeSurvey(id);
      showFlash('Encuesta cerrada.');
      await load();
    } catch {
      showFlash('Error al cerrar.', true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta encuesta y todos sus votos?')) return;
    try {
      await deleteSurvey(id);
      showFlash('Encuesta eliminada.');
      await load();
    } catch {
      showFlash('Error al eliminar.', true);
    }
  };

  const handleViewResults = async (id: string) => {
    const result = await getSurveyResults(id);
    setViewResult(result);
  };

  const inputClass = 'w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all';
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">Encuestas</h1>
          <p className="text-sm text-neutral-400">Encuestas tácticas y de opinión para los hinchas.</p>
        </div>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="flex items-center gap-2 bg-riverRed hover:bg-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30"
        >
          {showCreate ? <><X className="w-4 h-4" /> Cancelar</> : <><Plus className="w-4 h-4" /> Nueva encuesta</>}
        </button>
      </div>

      {flash && (
        <div className={`p-3 rounded-xl text-sm border ${flash.error ? 'bg-red-950/30 border-red-900/50 text-red-200' : 'bg-green-950/30 border-green-900/50 text-green-200'}`}>
          {flash.msg}
        </div>
      )}

      {/* Form crear */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-sm uppercase tracking-wider text-riverRed">Nueva encuesta</h2>
          <div>
            <label className={labelClass}>Pregunta</label>
            <input
              className={inputClass}
              placeholder="¿Cuál debería ser la formación titular?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Opciones</label>
            {optionLabels.map((label, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={inputClass}
                  placeholder={`Opción ${i + 1}`}
                  value={label}
                  onChange={(e) => {
                    const updated = [...optionLabels];
                    updated[i] = e.target.value;
                    setOptionLabels(updated);
                  }}
                />
                {optionLabels.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setOptionLabels(optionLabels.filter((_, j) => j !== i))}
                    className="p-2 rounded-xl border border-neutral-800 hover:border-riverRed hover:text-riverRed text-neutral-500 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {optionLabels.length < 6 && (
              <button
                type="button"
                onClick={() => setOptionLabels([...optionLabels, ''])}
                className="text-xs text-riverRed hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Agregar opción
              </button>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={creating} className="bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30">
              {creating ? 'Creando…' : 'Crear encuesta'}
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-riverRed mx-auto" /></div>
      ) : surveys.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-sm text-neutral-500">
          No hay encuestas. Creá una con el botón de arriba.
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          {surveys.map((s, i) => (
            <div
              key={s.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 ${i !== surveys.length - 1 ? 'border-b border-neutral-800' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    s.active
                      ? 'bg-green-950/40 text-green-400 border-green-900/40'
                      : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                  }`}>
                    {s.active ? 'Activa' : 'Cerrada'}
                  </span>
                  <span className="text-[10px] text-neutral-600">
                    {new Date(s.createdAt).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <p className="text-sm font-semibold">{s.question}</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">{s._count.votes} votos</p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleViewResults(s.id)}
                  className="text-xs bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-lg transition-all"
                >
                  Ver resultados
                </button>
                {s.active && (
                  <button
                    onClick={() => handleClose(s.id)}
                    className="text-xs flex items-center gap-1 bg-neutral-950 hover:bg-yellow-950/30 border border-neutral-800 hover:border-yellow-700/50 text-neutral-300 hover:text-yellow-400 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Lock className="w-3 h-3" /> Cerrar
                  </button>
                )}
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-xs bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-riverRed text-neutral-300 hover:text-riverRed px-3 py-1.5 rounded-lg transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal resultados */}
      {viewResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg">Resultados</h2>
              <button onClick={() => setViewResult(null)} className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm font-semibold text-neutral-300">{viewResult.question}</p>
            <div className="space-y-3">
              {viewResult.options.map((opt) => (
                <div key={opt.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold">{opt.label}</span>
                    <span className="text-neutral-400 tabular-nums">{opt.count} votos · {opt.percent}%</span>
                  </div>
                  <div className="h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-riverRed rounded-full transition-all duration-700"
                      style={{ width: `${opt.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-600 text-right">Total: {viewResult.total} votos</p>
          </div>
        </div>
      )}
    </div>
  );
}
