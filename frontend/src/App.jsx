
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth_context";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/Home";
import Profile from "./pages/auth/Profile";
import Device from "./pages/Device";
import History from "./pages/History";
import Sensordata from "./pages/Sensordata";
import MainLayout from "./components/MainLayout";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

      <Route element={user ? <MainLayout /> : <Navigate to="/login" />}>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/device" element={<Device />} />
        <Route path="/device/:id/data" element={<Sensordata />} />
        <Route path="/history" element={<History />} />
      </Route>
    </Routes>
  );
}

export default App;
