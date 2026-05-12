import { useState, useRef, useEffect } from 'react';
import { useLiveChat } from '../hooks/useLiveChat';

export default function LiveChat() {
  const { messages, sendMessage } = useLiveChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = !!localStorage.getItem('river_app_token');

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl flex flex-col h-[500px] lg:h-[600px] shadow-2xl">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-riverRed animate-pulse" />
          Chat de Hinchas
        </h3>
        <span className="text-xs text-neutral-500 font-medium">
          {messages.length} msgs
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
            Sé el primero en comentar...
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
                {msg.user.avatar_url ? (
                  <img src={msg.user.avatar_url} alt={msg.user.display_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-neutral-400">
                    {msg.user.display_name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-sm text-white">{msg.user.display_name}</span>
                  <span className="text-[10px] text-neutral-500">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-neutral-300 mt-0.5 leading-relaxed break-words">{msg.body}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-800 bg-neutral-950/50 rounded-b-3xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-neutral-900 border border-neutral-700 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-riverRed transition-colors"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-riverRed text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Enviar
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/50 rounded-b-3xl text-center">
          <p className="text-sm text-neutral-400 mb-2">Inicia sesión para participar</p>
          <a href="/login" className="text-riverRed font-bold text-sm hover:underline">
            Ingresar a mi cuenta
          </a>
        </div>
      )}
    </div>
  );
}
