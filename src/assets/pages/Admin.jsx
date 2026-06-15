import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, query, getDocs, doc, getDoc, deleteDoc, where } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const Admin = () => {
  const navigate = useNavigate();
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('routes'); // 'routes', 'users', 'drivers'

  // Malumotlar statelari
  const [allRoutes, setAllRoutes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);

  // Modal statelari
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'route', 'user', 'driver'
  const [selectedData, setSelectedData] = useState(null);
  
  // Tanlangan reys uchun qo'shimcha statelar
  const [routeTickets, setRouteTickets] = useState([]);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
          setAdminInfo(userDocSnap.data());
          await fetchAllData(); 
        } else {
          navigate('/');
        }
      } else {
        navigate('/admin-auth'); 
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchAllData = async () => {
    try {
      // 1. Reyslar
      const qRoutes = query(collection(db, "routes"));
      const snapRoutes = await getDocs(qRoutes);
      const routesData = snapRoutes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      routesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllRoutes(routesData);

      // 2. Foydalanuvchilar (role === undefined yoki role yo'qlar yo'lovchilar hisoblanadi)
      const qUsers = query(collection(db, "users"));
      const snapUsers = await getDocs(qUsers);
      const usersList = [];
      const driversList = [];
      
      snapUsers.docs.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        if (data.role === 'driver') driversList.push(data);
        else if (data.role !== 'admin') usersList.push(data);
      });
      
      setAllUsers(usersList);
      setAllDrivers(driversList);

    } catch (err) {
      console.error("Ma'lumot tortishda xato:", err);
    }
  };

  const handleDeleteRoute = async (routeId, e) => {
    e.stopPropagation();
    if(window.confirm("Bu yo'nalishni rostdan ham o'chirmoqchimisiz?")) {
      await deleteDoc(doc(db, "routes", routeId));
      fetchAllData();
    }
  };

  // Reys ustiga bosganda
  const openRouteDetails = async (route) => {
    setModalType('route');
    setSelectedData(route);
    setSelectedSeatInfo(null);
    setIsModalOpen(true);
    setIsLoadingDetails(true);

    try {
      const q = query(collection(db, "tickets"), where("routeId", "==", route.id));
      const snap = await getDocs(q);
      setRouteTickets(snap.docs.map(d => d.data()));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Yo'lovchi ustiga bosganda
  const openUserDetails = async (user) => {
    setModalType('user');
    setSelectedData(user);
    setIsModalOpen(true);
    setIsLoadingDetails(true);

    try {
      // Yo'lovchining olgan barcha chiptalarini qidiramiz
      const q = query(collection(db, "tickets"), where("userEmail", "==", user.email));
      const snap = await getDocs(q);
      setRouteTickets(snap.docs.map(d => d.data()));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Haydovchi ustiga bosganda
  const openDriverDetails = async (driver) => {
    setModalType('driver');
    setSelectedData(driver);
    setIsModalOpen(true);
    setIsLoadingDetails(true);

    try {
      // Haydovchining barcha reyslarini qidiramiz
      const q = query(collection(db, "routes"), where("driverId", "==", driver.uid));
      const snap = await getDocs(q);
      setRouteTickets(snap.docs.map(d => d.data())); // routeTickets arrayini endi driver reyslari bilan toldiramiz
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (loading) return <div className="text-center mt-20 font-bold">Yuklanmoqda...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Tepa qism */}
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🛡️</span>
            <div>
              <h1 className="text-2xl font-black text-gray-800">Admin Boshqaruvi</h1>
              <p className="text-sm text-gray-500">Tizimni to'liq nazorat qilish</p>
            </div>
          </div>
          <button onClick={() => signOut(auth).then(() => navigate('/admin-auth'))} className="text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition">
            Tizimdan chiqish
          </button>
        </div>

        {/* Tab Menyu */}
        <div className="flex gap-4 mb-6">
          <button onClick={() => setActiveTab('routes')} className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'routes' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-indigo-50 border'}`}>
            Barcha Qatnovlar ({allRoutes.length})
          </button>
          <button onClick={() => setActiveTab('users')} className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-indigo-50 border'}`}>
            Yo'lovchilar ({allUsers.length})
          </button>
          <button onClick={() => setActiveTab('drivers')} className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'drivers' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-indigo-50 border'}`}>
            Haydovchilar ({allDrivers.length})
          </button>
        </div>

        {/* --- REYSLAR TAB --- */}
        {activeTab === 'routes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allRoutes.map(route => (
              <div key={route.id} onClick={() => openRouteDetails(route)} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-indigo-400 cursor-pointer transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-indigo-900">{route.from} ➔ {route.to}</h3>
                  <button onClick={(e) => handleDeleteRoute(route.id, e)} className="text-red-500 text-sm hover:underline">O'chirish</button>
                </div>
                <p className="text-sm text-gray-600 font-medium mb-3">Haydovchi: {route.driverName}</p>
                <div className="flex justify-between text-sm font-bold text-gray-500 bg-gray-50 p-2 rounded-lg">
                  <span>📅 {route.date}</span>
                  <span className="text-green-600">💵 {route.price.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- YO'LOVCHILAR TAB --- */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                <tr>
                  <th className="p-4">Email / Akkaunt</th>
                  <th className="p-4">Ro'yxatdan o'tgan</th>
                  <th className="p-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allUsers.map(user => (
                  <tr key={user.id} className="hover:bg-indigo-50/30 transition">
                    <td className="p-4 font-bold text-gray-800">{user.email}</td>
                    <td className="p-4 text-gray-500">{user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Noma\'lum'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => openUserDetails(user)} className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-lg font-bold hover:bg-indigo-200 text-sm">Chiptalarini ko'rish</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- HAYDOVCHILAR TAB --- */}
        {activeTab === 'drivers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allDrivers.map(driver => (
              <div key={driver.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-xl text-gray-800">{driver.fullName}</h3>
                  <p className="text-indigo-600 font-bold text-sm mt-1">🚌 {driver.busModel}</p>
                  <p className="text-gray-500 text-sm mt-1">☎ {driver.phone} | ✉ {driver.email}</p>
                </div>
                <button onClick={() => openDriverDetails(driver)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition">
                  Reyslari
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* UNIVERSAL MODAL OYNA (REYS / YO'LOVCHI / HAYDOVCHI UCHUN) */}
      {/* ========================================================= */}
      {isModalOpen && selectedData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-gray-50 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">
            
            <div className="bg-white p-5 px-8 border-b flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-800">
                {modalType === 'route' && 'Avtobus Chizmasi va Chiptalar'}
                {modalType === 'user' && 'Yo\'lovchi Tarixi'}
                {modalType === 'driver' && 'Haydovchi Reyslari'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-4xl text-gray-400 hover:text-red-500 font-light">&times;</button>
            </div>

            <div className="p-8 overflow-y-auto h-full">
              
              {/* MODAL ICHI: REYS TANLANGANDA */}
              {modalType === 'route' && (
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Chap: Avtobus */}
                  <div className="w-full md:w-1/2 flex justify-center items-start">
                    <div className="bg-white rounded-4xl border-2 border-gray-200 p-8 py-10 w-full max-w-[320px] shadow-sm">
                      <div className="w-full flex justify-end mb-8 border-b-2 border-gray-100 pb-6">
                        <div className="w-12 h-12 rounded-full border-4 border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50">⊖</div>
                      </div>
                      
                      <div className="flex flex-col gap-4">
                        {Array.from({ length: Math.ceil(selectedData.totalSeats / 4) }).map((_, rIdx) => (
                          <div key={rIdx} className="flex justify-between">
                            <div className="flex gap-3">
                              {[1, 2].map(col => {
                                const sNum = rIdx * 4 + col;
                                if(sNum > selectedData.totalSeats) return null;
                                const t = routeTickets.find(x => Number(x.seatNumber) === sNum);
                                return (
                                  <button key={sNum} onClick={() => setSelectedSeatInfo(t || null)}
                                    className={`w-11 h-12 rounded-xl font-bold text-sm ${selectedSeatInfo?.seatNumber === sNum ? 'bg-indigo-600 text-white' : t ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}>
                                    {sNum}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex gap-3">
                              {[3, 4].map(col => {
                                const sNum = rIdx * 4 + col;
                                if(sNum > selectedData.totalSeats) return null;
                                const t = routeTickets.find(x => Number(x.seatNumber) === sNum);
                                return (
                                  <button key={sNum} onClick={() => setSelectedSeatInfo(t || null)}
                                    className={`w-11 h-12 rounded-xl font-bold text-sm ${selectedSeatInfo?.seatNumber === sNum ? 'bg-indigo-600 text-white' : t ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}>
                                    {sNum}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* O'ng: Chipta info */}
                  <div className="w-full md:w-1/2">
                    {selectedSeatInfo ? (
                      <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                        <h4 className="font-black text-xl text-indigo-900 mb-4 border-b border-indigo-200 pb-2">O'rindiq {selectedSeatInfo.seatNumber}</h4>
                        <div className="space-y-3">
                          <p><span className="text-gray-500 font-bold block text-xs">FIO</span><span className="font-bold text-lg">{selectedSeatInfo.passengerName}</span></p>
                          <p><span className="text-gray-500 font-bold block text-xs">PASPORT</span><span className="font-mono bg-white px-2 py-1 rounded border">{selectedSeatInfo.passportSeries}</span></p>
                          <p><span className="text-gray-500 font-bold block text-xs">TELEFON</span><span className="font-bold">{selectedSeatInfo.passengerPhone}</span></p>
                          <p><span className="text-gray-500 font-bold block text-xs">NARXI</span><span className="font-black text-green-600">{Number(selectedSeatInfo.price).toLocaleString()} so'm</span></p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white p-10 rounded-2xl border border-dashed text-center text-gray-500 font-bold">Yo'lovchini ko'rish uchun qizil o'rindiqni bosing</div>
                    )}
                  </div>
                </div>
              )}

              {/* MODAL ICHI: YO'LOVCHI YOKI HAYDOVCHI TANLANGANDA (Ro'yxat chiqaradi) */}
              {(modalType === 'user' || modalType === 'driver') && (
                <div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800">Ushbu foydalanuvchiga tegishli {modalType === 'user' ? 'xarid qilingan chiptalar' : 'ochilgan reyslar'}</h3>
                  </div>

                  {isLoadingDetails ? <p className="text-center font-bold">Qidirilmoqda...</p> : routeTickets.length === 0 ? <p className="text-center text-gray-500 bg-white p-10 rounded-xl">Hech narsa topilmadi</p> : (
                    <div className="space-y-3">
                      {routeTickets.map((t, i) => (
                        <div key={i} className="bg-white p-4 border rounded-xl flex justify-between items-center shadow-sm">
                          <div>
                            <p className="font-bold text-lg text-indigo-900">{t.from} ➔ {t.to}</p>
                            <p className="text-sm text-gray-500 mt-1">Sana: {t.date} {modalType === 'user' && `| O'rindiq: ${t.seatNumber} | Ism: ${t.passengerName}`}</p>
                          </div>
                          {modalType === 'user' && <span className="font-black text-green-600">{Number(t.price).toLocaleString()} so'm</span>}
                          {modalType === 'driver' && <span className="font-bold text-gray-500">{t.totalSeats} o'rinli</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin;