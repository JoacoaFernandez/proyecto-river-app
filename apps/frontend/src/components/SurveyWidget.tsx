import { useEffect, useState } from 'react';
import { getActiveSurvey, getMyVote, voteSurvey } from '../services/surveys.service';
import type { SurveyResult } from '../services/surveys.service';

export default function SurveyWidget() {
  const [survey, setSurvey] = useState<SurveyResult | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const s = await getActiveSurvey();
      setSurvey(s);
      if (s) {
        const v = await getMyVote(s.id);
        setMyVote(v?.optionId ?? null);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleVote = async (optionId: string) => {
    if (!survey || myVote || voting) return;
    setVoting(true);
    try {
      await voteSurvey(survey.id, optionId);
      setMyVote(optionId);
      const updated = await getActiveSurvey();
      if (updated) setSurvey(updated);
    } catch {
      // silently ignore (already voted or closed)
    } finally {
      setVoting(false);
    }
  };

  if (loading || !survey) return null;

  const showResults = !!myVote;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-riverRed flex-shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-riverRed">Encuesta de la semana</span>
      </div>

      <p className="font-bold text-sm leading-snug">{survey.question}</p>

      <div className="space-y-2">
        {survey.options.map((opt) => {
          const isMyVote = myVote === opt.id;

          if (showResults) {
            return (
              <div key={opt.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={`font-semibold ${isMyVote ? 'text-white' : 'text-neutral-400'}`}>
                    {isMyVote && '✓ '}{opt.label}
                  </span>
                  <span className={`font-bold tabular-nums ${isMyVote ? 'text-riverRed' : 'text-neutral-500'}`}>
                    {opt.percent}%
                  </span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isMyVote ? 'bg-riverRed' : 'bg-neutral-600'}`}
                    style={{ width: `${opt.percent}%` }}
                  />
                </div>
              </div>
            );
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={voting}
              className="w-full text-left text-sm font-semibold bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed/50 disabled:opacity-60 px-4 py-2.5 rounded-xl transition-all"
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-neutral-600 text-right">
        {survey.total} {survey.total === 1 ? 'voto' : 'votos'}
        {!survey.active && ' · Encuesta cerrada'}
      </p>
    </div>
  );
}
