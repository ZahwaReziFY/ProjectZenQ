import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from './ProtectedRoute';

import Welcome from '../pages/Welcome';
import Auth from '../pages/Auth';
import Home from '../pages/Home';
import Doctors from '../pages/Doctors';
import DoctorProfile from '../pages/DoctorProfile';
import Consultation from '../pages/Consultation';
import HomeVisit from '../pages/HomeVisit';
import MedicineScan from '../pages/MedicineScan';
import Education from '../pages/Education';
import ArticleDetail from '../pages/ArticleDetail';
import Checkout from '../pages/Checkout';
import History from '../pages/History';
import OrderDetail from '../pages/OrderDetail';
import Notifications from '../pages/Notifications';
import Profile from '../pages/Profile';
import Emergency from '../pages/Emergency';
import Chatbot from '../pages/Chatbot';
import DoctorDashboard from '../pages/DoctorDashboard';
import DoctorVisit from '../pages/DoctorVisit';
import NotFound from '../pages/NotFound';

import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminDoctors from '../pages/admin/AdminDoctors';
import AdminArticles from '../pages/admin/AdminArticles';
import AdminOrders from '../pages/admin/AdminOrders';
import Help from '../pages/Help';
import PayPage from '../pages/PayPage';

/**
 * Semua route halaman. Welcome & Auth tampil full screen (tanpa navbar),
 * sisanya dibungkus <Layout /> (navbar + tombol Tanya AI).
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Full screen */}
      <Route path="/" element={<Welcome />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/register" element={<Navigate to="/auth?mode=daftar" replace />} />
      {/* Halaman bayar hasil scan QR (tanpa login, aksesnya pakai token) */}
      <Route path="/pay/:token" element={<PayPage />} />

      <Route element={<Layout />}>
        {/* Publik (bisa dilihat tanpa login) */}
        <Route path="/home" element={<Home />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:id" element={<DoctorProfile />} />
        <Route path="/education" element={<Education />} />
        <Route path="/education/:slug" element={<ArticleDetail />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/help" element={<Help />} />

        {/* Semua user yang login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/consultations/:id" element={<Consultation />} />
        </Route>

        {/* Pasien */}
        <Route element={<ProtectedRoute roles={['patient']} />}>
          <Route path="/home-visit" element={<HomeVisit />} />
          <Route path="/scan" element={<MedicineScan />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/history" element={<History />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
        </Route>

        {/* Dokter */}
        <Route element={<ProtectedRoute roles={['doctor']} />}>
          <Route path="/doctor" element={<DoctorDashboard />} />
        </Route>

        {/* Dokter & admin: detail kunjungan home visit (bisa ubah status) */}
        <Route element={<ProtectedRoute roles={['doctor', 'admin']} />}>
          <Route path="/doctor/visits/:id" element={<DoctorVisit />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/doctors" element={<AdminDoctors />} />
          <Route path="/admin/articles" element={<AdminArticles />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
