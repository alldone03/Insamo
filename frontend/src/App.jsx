
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth_context";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/Home";
import Profile from "./pages/auth/Profile";
import Device from "./pages/Device";
import History from "./pages/History";
import Sensordata from "./pages/Sensordata";
import LandingPage from "./pages/LandingPage";
import MainLayout from "./components/MainLayout";
import NotFound from "./pages/NotFound";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/home" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/home" />} />

      {/* Protected Routes */}
      <Route element={user ? <MainLayout /> : <Navigate to="/login" />}>
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/device" element={<Device />} />
        <Route path="/device/:id/data" element={<Sensordata />} />
        <Route path="/history" element={<History />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
