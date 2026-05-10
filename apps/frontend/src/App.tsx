// apps/frontend/src/App.tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Plantel from './pages/Plantel';
import JugadorDetalle from './pages/JugadorDetalle';
import Partidos from './pages/Partidos';
import ProximoPartido from './pages/ProximoPartido';
import Noticias from './pages/Noticias';
import NoticiaDetalle from './pages/NoticiaDetalle';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="max-w-6xl mx-auto px-4 mt-16 text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-neutral-400">Sección en construcción.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Home />} />
          <Route path="partidos" element={<Partidos />} />
          <Route path="partidos/proximo" element={<ProximoPartido />} />
          <Route path="plantel" element={<Plantel />} />
          <Route path="plantel/:id" element={<JugadorDetalle />} />
          <Route path="noticias" element={<Noticias />} />
          <Route path="noticias/:id" element={<NoticiaDetalle />} />
          <Route path="mas" element={<ComingSoon title="Más" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
