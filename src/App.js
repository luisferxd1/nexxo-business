import { Route, Routes, BrowserRouter, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { SearchProvider } from './context/SearchContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import Header from './components/Header';
import Banner from './components/Banner';
import Categories from './components/Categories';
import AdCarousel from './components/AdCarousel';
import BusinessCarousel from './components/BusinessCarousel';
import HowItWorks from './components/HowItWorks';
import FeaturedProducts from './components/FeaturedProducts';
import BusinessDashboard from './components/BusinessDashboard';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import TrackOrder from './pages/TrackOrder';
import TrackOrderClient from './pages/TrackOrderClient';
import Login from './components/Login';
import Profile from './components/Profile';
import RoleSelection from './components/RoleSelection';
import RegisterBusiness from './components/RegisterBusiness';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Cart from './components/Cart';
import NotFound from './components/NotFound';
import Footer from './components/Footer';
import SearchResults from './components/SearchResults';
import Notifications from './components/Notifications';
import CategoryProducts from './components/CategoryProducts';
import ProductPage from './pages/ProductPage';
import BusinessProducts from './pages/BusinessProducts';
import CustomerStats from './components/CustomerStats';
import CustomerOrders from './components/CustomerOrders';
import CustomerDashboard from './components/CustomerDashboard';
import Chat from './components/Chat';
import DeliveryPersonDashboard from './components/DeliveryPersonDashboard';
import DeliveryPersonProfile from './components/DeliveryPersonProfile';
import { Toaster } from 'react-hot-toast';
import { LoaderCircleIcon } from 'lucide-react';
import { LoadScript } from '@react-google-maps/api'; // Importar LoadScript

function AppContent() {
  const { user, userRole, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 p-2 md:p-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
            <LoaderCircleIcon className="w-12 h-12 md:w-14 md:h-14 text-custom-blue animate-spin" />
          </div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                !user ? (
                  <Navigate to="/login" replace />
                ) : userRole === undefined ? (
                  <Navigate to="/role-selection" replace />
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    <Banner />
                    <Categories isHeader={false} showProducts={false} />
                    <HowItWorks />
                    <AdCarousel />
                    <BusinessCarousel />
                    <FeaturedProducts />
                    <Testimonials />
                    <CTA />
                  </div>
                )
              }
            />
            <Route
              path="/categories"
              element={
                <div className="space-y-4 md:space-y-6">
                  <Categories isHeader={false} showProducts={true} />
                </div>
              }
            />
            <Route path="/categories/:categoryId" element={<CategoryProducts />} />
            <Route path="/product/:productId" element={<ProductPage />} />
            <Route path="/business/:businessId" element={<BusinessProducts />} />
            <Route
              path="/track"
              element={
                <ProtectedRoute allowedRole="business">
                  <TrackOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/track-client"
              element={
                <ProtectedRoute allowedRole="client">
                  <TrackOrderClient />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to={
                    userRole === 'business' ? '/business' :
                    userRole === 'client' ? '/client' :
                    userRole === 'deliveryPerson' ? '/delivery-person' :
                    '/'
                  } replace />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/role-selection"
              element={
                !user ? (
                  <Navigate to="/login" replace />
                ) : (
                  <RoleSelection />
                )
              }
            />
            <Route
              path="/delivery-person-profile"
              element={
                <ProtectedRoute allowedRole="deliveryPerson">
                  <DeliveryPersonProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client"
              element={
                <ProtectedRoute allowedRole="client">
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:chatId"
              element={
                <ProtectedRoute allowedRole="client">
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business"
              element={
                <ProtectedRoute allowedRole="business">
                  <BusinessDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/customer-stats"
              element={
                <ProtectedRoute allowedRole="business">
                  <CustomerStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/customer/:customerId/orders"
              element={
                <ProtectedRoute allowedRole="business">
                  <CustomerOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/delivery-person"
              element={
                <ProtectedRoute allowedRole="deliveryPerson">
                  <DeliveryPersonDashboard />
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
            <Route path="/search" element={<SearchResults />} />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRole={null}>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <SearchProvider>
            <NotificationsProvider>
              <LoadScript googleMapsApiKey="AIzaSyAGHUkHNwdIkwmTeVKOhyAgHpkKyZW2Khc">
                <AppContent />
              </LoadScript>
            </NotificationsProvider>
          </SearchProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}