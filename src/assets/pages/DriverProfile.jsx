import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const DriverProfile = () => {
  const navigate = useNavigate();
  const [driverInfo, setDriverInfo] = useState(null);
  const [myRoutes, setMyRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [routeData, setRouteData] = useState({
    from: '', to: '', date: '', price: '', totalSeats: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().role === 'driver') {
          const dInfo = userDocSnap.data();
          setDriverInfo(dInfo);
          await fetchMyRoutes(user.uid); 
        } else {
          navigate('/');
        }
      } else {
        navigate('/driver-auth'); // Kirmagan bo'lsa, haydovchilar auth sahifasiga qaytaradi
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

      alert("Yangi yo'nalish muvaffaqiyatli qo'shildi!");
      setRouteData({ from: '', to: '', date: '', price: '', totalSeats: '' });
      fetchMyRoutes(auth.currentUser.uid); 
      
    } catch (error) {
      console.error("Xatolik:", error);
      alert("Yo'nalish qo'shishda xatolik yuz berdi.");
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if(window.confirm("Bu yo'nalishni rostdan ham o'chirmoqchimisiz?")) {
      await deleteDoc(doc(db, "routes", routeId));
      fetchMyRoutes(auth.currentUser.uid);
    }
  };

  // --- YANGILANGAN CHIQISH FUNKSIYASI ---
  const handleLogout = async () => {
    if(window.confirm("Tizimdan chiqmoqchimisiz?")) {
      await signOut(auth);
      navigate('/'); // Chiqqandan keyin haydovchilar kirish oynasiga boradi
    }
  };

  if (loading) return <div className="text-center mt-20 text-xl font-bold">Yuklanmoqda...</div>;

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* YANGI: Sahifa sarlavhasi va Chiqish tugmasi */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-4 px-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <span className="text-3xl">🚌</span>
            <div>
              <h1 className="text-2xl font-black text-gray-800">Haydovchi Kabineti</h1>
              <p className="text-sm text-gray-500">Avtobus qatnovlarini boshqarish paneli</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-6 rounded-xl transition duration-200"
          >
            <span>🚪</span> Tizimdan chiqish
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CHAP TOMON: Shaxsiy ma'lumotlar va Forma */}
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
                  <input type="text" required value={routeData.from} onChange={(e) => setRouteData({...routeData, from: e.target.value})} className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="Masalan: Toshkent" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Qayerga</label>
                  <input type="text" required value={routeData.to} onChange={(e) => setRouteData({...routeData, to: e.target.value})} className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="Masalan: Buxoro" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Sana</label>
                  <input type="date" required value={routeData.date} onChange={(e) => setRouteData({...routeData, date: e.target.value})} className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-700">O'rinlar</label>
                    <input type="number" required value={routeData.totalSeats} onChange={(e) => setRouteData({...routeData, totalSeats: e.target.value})} className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="45" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">Narx (so'm)</label>
                    <input type="number" required value={routeData.price} onChange={(e) => setRouteData({...routeData, price: e.target.value})} className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="150000" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl mt-2 transition shadow-md">
                  Yo'nalishni qo'shish
                </button>
              </form>
            </div>
          </div>

          {/* O'NG TOMON: Haydovchining aktiv yo'nalishlari */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 h-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Mening qatnovlarim</h2>
              
              {myRoutes.length === 0 ? (
                <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-xl border border-dashed">
                  Hozircha qatnovlar yo'q. Chap tomondagi forma orqali yangi yo'nalish qo'shing.
                </div>
              ) : (
                <div className="space-y-4">
                  {myRoutes.map(route => (
                    <div key={route.id} className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{route.from} ➔ {route.to}</h3>
                        <div className="text-sm text-gray-500 mt-1 flex gap-4">
                          <span>📅 {route.date}</span>
                          <span>👥 {route.totalSeats} o'rin</span>
                          <span>💵 {route.price.toLocaleString()} so'm</span>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="font-bold text-blue-600">Band qilingan: </span> 
                          {route.bookedSeats?.length > 0 ? route.bookedSeats.length + " ta o'rindiq" : "Hozircha yo'q"}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteRoute(route.id)}
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
    </div>
  );
};

export default DriverProfile;