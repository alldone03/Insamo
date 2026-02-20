
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth_context";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/Home";
import Profile from "./pages/auth/Profile";
import Device from "./pages/Device";
import AiPredict from './pages/AiPredict';
import Flood from './pages/Flood';
import Earthquake from './pages/Earthquake';
import Landslide from './pages/Landslide';
import Wildfire from './pages/Wildfire';
import Weather from './pages/Weather';
import History from "./pages/History";
import Sensordata from "./pages/Sensordata";
import MainLayout from "./components/MainLayout";
import NotFound from "./pages/NotFound";

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
        <Route path="/predict" element={<AiPredict />} />
        <Route path="/flood" element={<Flood />} />
        <Route path="/earthquake" element={<Earthquake />} />
        <Route path="/landslide" element={<Landslide />} />
        <Route path="/wildfire" element={<Wildfire />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/device/:id/data" element={<Sensordata />} />
        <Route path="/history" element={<History />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
