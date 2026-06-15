import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const regionsData = {
  "Toshkent": ["Toshkent shahri"],
  "Sirdaryo": ["Sirdaryo tumani", "Oqoltin", "Sayxunobod", "Mirzaobod", "Guliston"],
  "Jizzax": ["Sharof Rashidov", "G‘allaorol"],
  "Samarqand": ["Bulung‘ur", "Jomboy", "Samarqand", "Oqdaryo", "Ishtixon", "Kattaqo‘rg‘on", "Paxtachi", "Pastdarg‘om", "Nurobod"],
  "Navoiy": ["Xatirchi", "Karmana", "Qiziltepa"],
  "Buxoro": ["G‘ijduvon", "Vobkent", "Peshku", "Buxoro", "Jondor", "Romitan", "Qorako'l", "Olot"],
  "Xorazm": ["Tuproqqal’a", "Urganch", "Xiva", "Shovot", "Gurlan"],
  "Qoraqalpog'iston": ["To‘rtko‘l", "Beruniy", "Amudaryo", "Nukus"],
  "Qashqadaryo": ["Kitob", "Shahrisabz", "Yakkabog‘", "Qamashi", "G‘uzor", "Dehqonobod"],
  "Surxondaryo": ["Boysun", "Bandixon", "Sherobod", "Angor", "Termiz"],
  "Namangan": ["Pop", "Chust", "Namangan"],
  "Farg'ona": ["Qo'qon", "Farg'ona", "Marg'ilon"],
  "Andijon": ["Asaka", "Andijon"]
};

const DriverProfile = () => {
  const navigate = useNavigate();
  const [driverInfo, setDriverInfo] = useState(null);
  const [myRoutes, setMyRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [routeData, setRouteData] = useState({
    from: '', to: '', date: '', price: '', totalSeats: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeTickets, setRouteTickets] = useState([]); 
  const [selectedSeatInfo, setSelectedSeatInfo] = useState(null); 
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().role === 'driver') {
          setDriverInfo(userDocSnap.data());
          await fetchMyRoutes(user.uid); 
        } else {
          navigate('/');
        }
      } else {
        navigate('/driver-auth'); 
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchMyRoutes = async (driverId) => {
    const q = query(collection(db, "routes"), where("driverId", "==", driverId));
    const querySnapshot = await getDocs(q);
    const routesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    routesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setMyRoutes(routesData);
  };

  const handleAddRoute = async (e) => {
    e.preventDefault();
    if(routeData.from === routeData.to) {
        showToast("Qayerdan va Qayerga bir xil bo'lishi mumkin emas!", "error"); return;
    }
    try {
      await addDoc(collection(db, "routes"), {
        driverId: auth.currentUser.uid,
        driverName: driverInfo.fullName,
        busModel: driverInfo.busModel,
        from: routeData.from,
        to: routeData.to,
        date: routeData.date,
        price: Number(routeData.price),
        totalSeats: Number(routeData.totalSeats),
        bookedSeats: [],
        createdAt: new Date().toISOString()
      });
      showToast("Yangi yo'nalish muvaffaqiyatli qo'shildi!", "success");
      setRouteData({ from: '', to: '', date: '', price: '', totalSeats: '' });
      fetchMyRoutes(auth.currentUser.uid); 
    } catch (error) {
      showToast("Yo'nalish qo'shishda xatolik yuz berdi.", "error");
    }
  };

  const handleDeleteRoute = async (routeId, e) => {
    e.stopPropagation();
    if(window.confirm("Bu yo'nalishni rostdan ham o'chirmoqchimisiz?")) {
      try {
        await deleteDoc(doc(db, "routes", routeId));
        showToast("Yo'nalish muvaffaqiyatli o'chirildi!", "success");
        fetchMyRoutes(auth.currentUser.uid);
      } catch(error) {
        showToast("O'chirishda xatolik yuz berdi.", "error");
      }
    }
  };

  const openRouteDetails = async (route) => {
    setSelectedRoute(route);
    setSelectedSeatInfo(null);
    setIsModalOpen(true);
    setIsLoadingTickets(true);

    try {
      const q = query(collection(db, "tickets"), where("routeId", "==", route.id));
      const snap = await getDocs(q);
      const tickets = snap.docs.map(d => d.data());
      setRouteTickets(tickets);
    } catch (error) {
      console.error("Chiptalarni yuklashda xato:", error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleLogout = async () => {
    if(window.confirm("Tizimdan chiqmoqchimisiz?")) {
      await signOut(auth);
      navigate('/driver-auth'); 
    }
  };

  if (loading) return <div className="text-center mt-20 text-xl font-bold">Yuklanmoqda...</div>;

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gray-50 py-10 px-4 relative overflow-hidden">
      
      {/* TOAST BILDIRISHNOMA */}
      <div className={`fixed top-24 right-5 z-100 transition-all duration-500 transform ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-32 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center bg-white border-l-4 p-4 rounded-xl shadow-2xl min-w-75 ${toast.type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
          <div className={`text-2xl mr-4 ${toast.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {toast.type === 'success' ? '✅' : '⚠️'}
          </div>
          <div className="flex-1">
            <h4 className="text-gray-900 font-bold text-sm">{toast.type === 'success' ? 'Muvaffaqiyatli' : 'Diqqat'}</h4>
            <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto z-10">
        {/* Tepa qism */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-4 px-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <span className="text-3xl">🚌</span>
            <div>
              <h1 className="text-2xl font-black text-gray-800">Haydovchi Kabineti</h1>
              <p className="text-sm text-gray-500">Avtobus qatnovlarini boshqarish paneli</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-6 rounded-xl transition duration-200">
            <span>🚪</span> Tizimdan chiqish
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CHAP TOMON */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 text-center">
              <h2 className="text-xl font-bold text-gray-800">{driverInfo?.fullName}</h2>
              <p className="text-blue-600 font-bold mt-1 text-lg">{driverInfo?.busModel}</p>
              <p className="text-sm text-gray-400 mt-2">☎ {driverInfo?.phone}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Yangi qatnov ochish</h3>
              <form onSubmit={handleAddRoute} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700">Qayerdan</label>
                  <select required value={routeData.from} onChange={(e) => setRouteData({...routeData, from: e.target.value})} className="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white">
                    <option value="" disabled>Hududni tanlang</option>
                    {Object.keys(regionsData).map(region => (
                      <optgroup key={region} label={`📍 ${region} viloyati`}>
                        {regionsData[region].map(tuman => (
                          <option key={tuman} value={tuman}>{tuman}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Qayerga</label>
                  <select required value={routeData.to} onChange={(e) => setRouteData({...routeData, to: e.target.value})} className="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white">
                    <option value="" disabled>Hududni tanlang</option>
                    {Object.keys(regionsData).map(region => (
                      <optgroup key={region} label={`📍 ${region} viloyati`}>
                        {regionsData[region].map(tuman => (
                          <option key={tuman} value={tuman}>{tuman}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Sana</label>
                  <input type="date" required value={routeData.date} onChange={(e) => setRouteData({...routeData, date: e.target.value})} className="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-700">O'rinlar</label>
                    <input type="number" required value={routeData.totalSeats} onChange={(e) => setRouteData({...routeData, totalSeats: e.target.value})} className="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none" placeholder="45" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">Narx (so'm)</label>
                    <input type="number" required value={routeData.price} onChange={(e) => setRouteData({...routeData, price: e.target.value})} className="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none" placeholder="150000" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl mt-2 transition shadow-lg">
                  Yo'nalishni qo'shish
                </button>
              </form>
            </div>
          </div>

          {/* O'NG TOMON */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 h-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Mening qatnovlarim</h2>
              
              {myRoutes.length === 0 ? (
                <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-xl border border-dashed">
                  Hozircha qatnovlar yo'q. Yangi yo'nalish qo'shing.
                </div>
              ) : (
                <div className="space-y-4">
                  {myRoutes.map(route => (
                    <div 
                      key={route.id} 
                      onClick={() => openRouteDetails(route)}
                      className="p-5 border border-gray-200 rounded-xl hover:shadow-md hover:border-blue-300 transition flex flex-col md:flex-row justify-between md:items-center gap-4 cursor-pointer bg-white"
                    >
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{route.from} ➔ {route.to}</h3>
                        <div className="text-sm text-gray-500 mt-1 flex gap-4">
                          <span>📅 {route.date}</span>
                          <span>👥 {route.totalSeats} o'rin</span>
                          <span>💵 {route.price.toLocaleString()} so'm</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteRoute(route.id, e)}
                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg font-bold transition text-sm whitespace-nowrap"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* MODAL OYNA */}
      {isModalOpen && selectedRoute && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-gray-50 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in-up">
            
            <div className="bg-white p-5 px-8 border-b flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-2xl font-black text-gray-800">Yo'nalish Tafsilotlari</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 text-3xl font-bold leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 transition">
                ×
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 p-8 overflow-y-auto">
              
              {/* 1-Ustun: Avtobus Sxemasi */}
              <div className="w-full md:w-1/2 flex justify-center items-start pt-4">
                <div className="bg-white rounded-4xl border-2 border-gray-200 p-8 py-10 w-full max-w-[320px] flex flex-col items-center shadow-sm relative">
                  
                  <div className="w-full flex justify-end mb-8 border-b-2 border-gray-100 pb-6">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50">
                      <span className="text-2xl font-bold">⊖</span>
                    </div>
                  </div>

                  {isLoadingTickets ? (
                    <div className="py-10 text-gray-400 font-medium">Yuklanmoqda...</div>
                  ) : (
                    <div className="flex flex-col gap-4 w-full">
                      {Array.from({ length: Math.ceil(selectedRoute.totalSeats / 4) }).map((_, rowIndex) => (
                        <div key={rowIndex} className="flex justify-between w-full">
                          
                          {/* Chap tomon */}
                          <div className="flex gap-3">
                            {[1, 2].map(col => {
                              const seatNum = rowIndex * 4 + col;
                              if(seatNum > selectedRoute.totalSeats) return null;
                              
                              // TUZATILDI: Number() solishtiruvi va dual-check qo'shildi
                              const ticket = routeTickets.find(t => Number(t.seatNumber) === seatNum);
                              const isRouteArrayBooked = selectedRoute.bookedSeats?.map(Number).includes(seatNum);
                              const isBooked = !!ticket || isRouteArrayBooked;
                              const isSelected = selectedSeatInfo?.seatNumber === seatNum;

                              return (
                                <button
                                  key={seatNum}
                                  onClick={() => {
                                    if (ticket) {
                                      setSelectedSeatInfo(ticket);
                                    } else if (isBooked) {
                                      setSelectedSeatInfo({ 
                                        seatNumber: seatNum, 
                                        passengerName: "O'rin band (Massivda)", 
                                        passengerPhone: "Ma'lumot mavjud emas" 
                                      });
                                    } else {
                                      setSelectedSeatInfo(null);
                                    }
                                  }}
                                  className={`w-11 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200 shadow-sm
                                    ${isSelected ? 'bg-blue-600 text-white shadow-blue-500/30 border-blue-600' : 
                                      isBooked ? 'bg-red-100 text-red-600 border border-red-200 hover:bg-red-200 cursor-pointer' : 
                                      'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 cursor-default'}`}
                                >
                                  {seatNum}
                                </button>
                              );
                            })}
                          </div>

                          {/* O'ng tomon */}
                          <div className="flex gap-3">
                            {[3, 4].map(col => {
                              const seatNum = rowIndex * 4 + col;
                              if(seatNum > selectedRoute.totalSeats) return null;
                              
                              // TUZATILDI: Number() solishtiruvi va dual-check qo'shildi
                              const ticket = routeTickets.find(t => Number(t.seatNumber) === seatNum);
                              const isRouteArrayBooked = selectedRoute.bookedSeats?.map(Number).includes(seatNum);
                              const isBooked = !!ticket || isRouteArrayBooked;
                              const isSelected = selectedSeatInfo?.seatNumber === seatNum;

                              return (
                                <button
                                  key={seatNum}
                                  onClick={() => {
                                    if (ticket) {
                                      setSelectedSeatInfo(ticket);
                                    } else if (isBooked) {
                                      setSelectedSeatInfo({ 
                                        seatNumber: seatNum, 
                                        passengerName: "O'rin band (Massivda)", 
                                        passengerPhone: "Ma'lumot mavjud emas" 
                                      });
                                    } else {
                                      setSelectedSeatInfo(null);
                                    }
                                  }}
                                  className={`w-11 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200 shadow-sm
                                    ${isSelected ? 'bg-blue-600 text-white shadow-blue-500/30 border-blue-600' : 
                                      isBooked ? 'bg-red-100 text-red-600 border border-red-200 hover:bg-red-200 cursor-pointer' : 
                                      'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 cursor-default'}`}
                                >
                                  {seatNum}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2-Ustun: Chipta / Yo'lovchi Ma'lumotlari */}
              <div className="w-full md:w-1/2 flex flex-col justify-start">
                <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 sticky top-8">
                  <h3 className="text-2xl font-black text-gray-800 mb-6">Chipta ma'lumotlari</h3>
                  
                  <div className="bg-blue-50/50 rounded-2xl p-5 mb-6 border border-blue-100/50 space-y-3">
                    <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                      <span className="text-gray-500 font-medium">Yo'nalish:</span>
                      <span className="font-bold text-blue-900 text-right">{selectedRoute.from} ➔ {selectedRoute.to}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Sana:</span>
                      <span className="font-bold text-gray-800">{selectedRoute.date}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Avtobus:</span>
                      <span className="font-bold text-gray-800">{selectedRoute.busModel} ({selectedRoute.totalSeats} o'rinli)</span>
                    </div>
                  </div>

                  <div className="flex gap-6 mb-8 pb-6 border-b border-gray-100 justify-center">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gray-50 border border-gray-200"></div><span className="text-sm text-gray-600 font-medium">Bo'sh</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div><span className="text-sm text-gray-600 font-medium">Band</span></div>
                  </div>

                  {selectedSeatInfo ? (
                    <div className="animate-fade-in-up bg-green-50/50 border border-green-100 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-black text-green-800">Sotilgan chipta</h4>
                        <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">O'rindiq: {selectedSeatInfo.seatNumber}</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-green-600/80 font-bold uppercase tracking-wider mb-1">Yo'lovchi Ismi</p>
                          <p className="font-bold text-gray-800 text-lg">{selectedSeatInfo.passengerName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-600/80 font-bold uppercase tracking-wider mb-1">Telefon Raqami</p>
                          <p className="font-bold text-gray-800 text-lg">{selectedSeatInfo.passengerPhone}</p>
                        </div>
                        <div className="pt-3 mt-3 border-t border-green-200/50 flex justify-between items-center">
                           <span className="text-green-700 font-medium">To'langan summa:</span>
                           <span className="font-black text-xl text-green-700">{selectedRoute.price.toLocaleString()} so'm</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <span className="text-4xl block mb-2">👤</span>
                      <p className="text-gray-500 font-medium">Yo'lovchi ma'lumotlarini ko'rish uchun<br/> qizil rangli o'rindiqni tanlang</p>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DriverProfile;