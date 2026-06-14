import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users'); // users, drivers, routes
  const [users, setUsers] = useState([]);
  const [routes, setRoutes] = useState([]);
  
  // YANGI: Xavfsizlik va yuklanish holatlari
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Sahifaga kirayotgan odamni tekshiramiz
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Uning bazadagi roliga qaraymiz
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
          setIsAdmin(true); // Ruxsat berildi
          fetchData();      // Ma'lumotlarni yuklaymiz
        } else {
          // Admin emas, haydab yuboramiz
          alert("Sizda Admin panelga kirish huquqi yo'q!");
          navigate('/');
        }
      } else {
        // Tizimga umuman kirmagan
        navigate('/login');
      }
      setLoading(false); // Tekshiruv tugadi
    });

    return () => unsubscribe();
  }, [navigate]);

  // 2. Faqat ruxsat olingandan keyin ishlaydigan ma'lumot tortish funksiyasi
  const fetchData = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const routesSnap = await getDocs(collection(db, "routes"));
      setRoutes(routesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Ma'lumotlarni yuklashda xatolik:", error);
    }
  };

  // Ekranda tekshiruv jarayonini ko'rsatish
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-4xl animate-spin mb-4">⚙️</div>
        <div className="text-xl font-bold text-gray-500">Huquqlar tekshirilmoqda...</div>
      </div>
    );
  }

  // Agar admin bo'lmasa, sahifani umuman chizmaymiz (xavfsizlik uchun)
  if (!isAdmin) return null;

  // Ma'lumotlarni turiga qarab filtrlash
  const passengers = users.filter(u => u.role === 'user');
  const drivers = users.filter(u => u.role === 'driver');

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Boshqaruv Paneli (Admin)</h1>
          <button 
            onClick={() => navigate('/')} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold transition"
          >
            Asosiy saytga qaytish
          </button>
        </div>

        {/* Tab tugmalari */}
        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('users')} className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Yo'lovchilar ({passengers.length})</button>
          <button onClick={() => setActiveTab('drivers')} className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'drivers' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Haydovchilar ({drivers.length})</button>
          <button onClick={() => setActiveTab('routes')} className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'routes' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Aktiv Yo'nalishlar ({routes.length})</button>
        </div>

        {/* 1. YO'LOVCHILAR TABI */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-gray-500 uppercase text-xs">
                  <th className="py-4">Ism-sharif</th>
                  <th className="py-4">Telefon</th>
                  <th className="py-4">Email</th>
                  <th className="py-4">Ro'yxatdan o'tgan</th>
                </tr>
              </thead>
              <tbody>
                {passengers.length === 0 ? <tr><td colSpan="4" className="py-6 text-center text-gray-500">Hozircha yo'lovchilar yo'q.</td></tr> : null}
                {passengers.map(p => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 font-bold text-gray-800">{p.fullName || 'Kiritilmagan'}</td>
                    <td className="py-4 text-gray-600">{p.phone || 'Kiritilmagan'}</td>
                    <td className="py-4 text-blue-600">{p.email}</td>
                    <td className="py-4 text-sm text-gray-400">Yangi</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. HAYDOVCHILAR TABI */}
        {activeTab === 'drivers' && (
          <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-gray-500 uppercase text-xs">
                  <th className="py-4">Haydovchi ismi</th>
                  <th className="py-4">Avtobus / Telefon</th>
                  <th className="py-4">Ochgan yo'nalishlari va Sanalari</th>
                  <th className="py-4">Harakatlar</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => {
                  const driverRoutes = routes.filter(r => r.driverName === d.fullName || r.driverId === d.id);
                  
                  return (
                    <tr key={d.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 font-bold text-gray-800">{d.fullName}</td>
                      <td className="py-4">
                        <span className="block font-medium text-blue-700">{d.busModel}</span>
                        <span className="block text-sm text-gray-500">{d.phone}</span>
                      </td>
                      <td className="py-4">
                        {driverRoutes.length === 0 ? <span className="text-gray-400 italic">Hali yo'nalish ochmagan</span> : (
                          <div className="flex flex-col gap-1">
                            {driverRoutes.map(r => (
                              <span key={r.id} className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded text-xs font-bold w-fit">
                                {r.from} ➔ {r.to} ({r.date})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        <button className="text-red-500 hover:text-red-700 text-sm font-bold">Bloklash</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. YO'NALISHLAR TABI */}
        {activeTab === 'routes' && (
          <div className="bg-white rounded-2xl shadow p-6">
            {routes.length === 0 ? <div className="text-center text-gray-500 py-4">Aktiv yo'nalishlar yo'q</div> : null}
            {routes.map(r => (
              <div key={r.id} className="flex flex-wrap md:flex-nowrap justify-between items-center border-b p-4 gap-4 hover:bg-gray-50 rounded-lg">
                <div>
                  <span className="text-lg font-bold text-gray-800 block">{r.from} ➔ {r.to}</span>
                  <span className="text-sm text-gray-500">Sana: {r.date} | Narx: {r.price} so'm | Haydovchi: {r.driverName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Aktiv</span>
                  <button 
                    onClick={async () => { await deleteDoc(doc(db, "routes", r.id)); window.location.reload(); }} 
                    className="text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-bold transition"
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Admin;