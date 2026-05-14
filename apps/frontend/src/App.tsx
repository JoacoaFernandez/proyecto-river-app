// apps/frontend/src/App.tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Plantel from './pages/Plantel';
import JugadorDetalle from './pages/JugadorDetalle';
import Partidos from './pages/Partidos';
import ProximoPartido from './pages/ProximoPartido';
import PartidoEnVivo from './pages/PartidoEnVivo';
import PartidoDetalle from './pages/PartidoDetalle';
import Comparador from './pages/Comparador';
import Noticias from './pages/Noticias';
import NoticiaDetalle from './pages/NoticiaDetalle';
import Estadisticas from './pages/Estadisticas';
import Competiciones from './pages/Competiciones';
import Historia from './pages/Historia';
import Perfil from './pages/Perfil';
import RankingProde from './pages/RankingProde';
import Formaciones from './pages/Formaciones';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminNoticias from './pages/admin/AdminNoticias';
import AdminPartidos from './pages/admin/AdminPartidos';
import AdminPlantel from './pages/admin/AdminPlantel';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="max-w-6xl mx-auto px-4 mt-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl font-black text-neutral-600">—</span>
      </div>
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
        <Route path="/register" element={<Register />} />

        {/* App pública (autenticada) */}
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
          <Route path="partidos/en-vivo" element={<PartidoEnVivo />} />
          <Route path="partidos/:id" element={<PartidoDetalle />} />
          <Route path="comparador" element={<Comparador />} />
          <Route path="plantel" element={<Plantel />} />
          <Route path="plantel/:id" element={<JugadorDetalle />} />
          <Route path="noticias" element={<Noticias />} />
          <Route path="noticias/:id" element={<NoticiaDetalle />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          <Route path="competiciones" element={<Competiciones />} />
          <Route path="historia" element={<Historia />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="prode" element={<RankingProde />} />
          <Route path="formaciones" element={<Formaciones />} />
          <Route path="mas" element={<ComingSoon title="Más" />} />
        </Route>

        {/* Panel de administración (admin only) */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="partidos" element={<AdminPartidos />} />
          <Route path="noticias" element={<AdminNoticias />} />
          <Route path="plantel" element={<AdminPlantel />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
