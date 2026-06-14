import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './assets/pages/Home';
import Login from './assets/pages/Login';
import Seats from './assets/pages/Seats';
import Checkout from './assets/pages/Checkout';
import Ticket from './assets/pages/Ticket';
import Profile from './assets/pages/Profile';
import Admin from './assets/pages/Admin';
import DriverProfile from './assets/pages/DriverProfile';
import DriverRegister from './assets/pages/DriverRegister';

function App() {
  // Foydalanuvchi tizimga kirganligini tekshirish (Local storage orqali saqlaymiz)
  const [isAuth, setIsAuth] = useState(localStorage.getItem('isAuth') === 'true');

  // Tizimga kirish funksiyasi (Buni Login sahifasiga berib yuboramiz)
  const handleLogin = () => {
    localStorage.setItem('isAuth', 'true');
    setIsAuth(true);
  };

  // Tizimdan chiqish funksiyasi
  const handleLogout = () => {
    localStorage.removeItem('isAuth');
    setIsAuth(false);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        
        {/* Yangilangan, Haqiqiy Navigatsiya */}
        <nav className="bg-white shadow-sm border-b border-gray-200 p-4 px-8 flex justify-between items-center">
          <Link to="/" className="text-2xl font-black text-blue-600 tracking-tight">
            AvtoTicket
          </Link>
          
          {/* Agar tizimga kirgan bo'lsa, Profil va Chiqish tugmalari ko'rinadi */}
          {isAuth && (
            <div className="flex items-center gap-6">
              <Link to="/profile" className="text-gray-600 font-bold hover:text-blue-600 transition">
                Mening profilim
              </Link>
              
             
              <button 
                onClick={handleLogout} 
                className="bg-red-50 text-red-500 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition"
              >
                Chiqish
              </button>
              
            </div>
          )}
        </nav>

        {/* Qat'iy ketma-ketlikka asoslangan Router */}
        <main className="flex-1">
          <Routes>
            {/* 1. Avtorizatsiya: Agar tizimga kirgan bo'lsa Asosiyga otib yuboradi, kirmagan bo'lsa Loginni ochadi */}
            <Route path="/login" element={!isAuth ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
            
            {/* 2. Asosiy Qidiruv: Faqat tizimga kirganlar uchun */}
            <Route path="/" element={isAuth ? <Home /> : <Navigate to="/login" />} />
            
            {/* 3. O'rindiq tanlash */}
            <Route path="/seats" element={isAuth ? <Seats /> : <Navigate to="/login" />} />
            
            {/* 4. Rasmiylashtirish */}
            <Route path="/checkout" element={isAuth ? <Checkout /> : <Navigate to="/login" />} />
            
            {/* 5. Chipta natijasi */}
            <Route path="/ticket" element={isAuth ? <Ticket /> : <Navigate to="/login" />} />
            
            {/* 6. Profil */}
            <Route path="/profile" element={isAuth ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/admin" element={isAuth ? <Admin /> : <Navigate to="/login" />} />
            <Route path="/driver" element={<DriverProfile />} />
            <Route element={<DriverRegister />} path="/driver-register" /> 
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}

export default App;