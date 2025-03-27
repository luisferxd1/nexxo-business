// src/App.jsx
import { Route, Routes } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { SearchProvider } from './context/SearchContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext'; // Añadimos el nuevo contexto
import Header from './components/Header';
import Banner from './components/Banner';
import Categories from './components/Categories';
import HowItWorks from './components/HowItWorks';
import FeaturedProducts from './components/FeaturedProducts';
import BusinessDashboard from './components/BusinessDashboard';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import TrackOrder from './components/TrackOrder';
import Login from './components/Login';
import Profile from './components/Profile';
import RoleSelection from './components/RoleSelection';
import RegisterBusiness from './components/RegisterBusiness';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import NotFound from './components/NotFound';
import Footer from './components/Footer';
import SearchResults from './components/SearchResults';
import Notifications from './components/Notifications';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <NotificationsProvider> {/* Añadimos el NotificationsProvider */}
            <div className="p-4 min-h-screen flex flex-col">
              <Header />
              <main className="flex-1 space-y-6">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <>
                        <Banner />
                        <Categories />
                        <HowItWorks />
                        <FeaturedProducts />
                        <Testimonials />
                        <div className="space-y-0">
                          <CTA />
                          <Footer />
                        </div>
                      </>
                    }
                  />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/track" element={<TrackOrder />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/role-selection" element={<RoleSelection />} />
                  <Route
                    path="/business"
                    element={
                      <ProtectedRoute allowedRole="business">
                        <BusinessDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute allowedRole={null}>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/register-business"
                    element={
                      <ProtectedRoute allowedRole="business">
                        <RegisterBusiness />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRole="admin">
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            </div>
          </NotificationsProvider>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
}