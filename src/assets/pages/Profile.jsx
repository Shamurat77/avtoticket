import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const Profile = () => {
  const navigate = useNavigate();
  const [travelHistory, setTravelHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // 1. Sahifa ochilganda foydalanuvchi ma'lumotlarini va uning chiptalarini yuklash
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchUserTickets(user.uid);
      } else {
        // Agar foydalanuvchi tizimga kirmagan bo'lsa, login sahifasiga qaytarish
        navigate('/login');
      }
    });

    return () => unsubscribe(); // Tozalash
  }, [navigate]);

  // 2. Bazadan faqat shu foydalanuvchiga tegishli chiptalarni o'qib olish
  const fetchUserTickets = async (userId) => {
    try {
      const q = query(collection(db, "tickets"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      const ticketsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Sanani tekshirib, statusni avtomatik aniqlash (Bugundan o'tgan bo'lsa -> Yakunlangan)
        const today = new Date().toISOString().split('T')[0];
        const status = data.date >= today ? 'Kutilmoqda' : 'Yakunlangan';

        return {
          id: doc.id,
          ...data,
          status: status
        };
      });

      // Eng oxirgi sotib olingan chiptani birinchi qatorga chiqarish uchun sanasi bo'yicha tartiblash
      ticketsData.sort((a, b) => new Date(b.date) - new Date(a.date));

      setTravelHistory(ticketsData);
    } catch (error) {
      console.error("Chiptalarni yuklashda xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Tizimdan chiqish funksiyasi
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Tizimdan chiqishda xatolik:", error);
    }
  };

  // Foydalanuvchi email'idan ismini ajratib olish (Masalan: ali@gmail.com -> ali)
  const displayName = currentUser?.email ? currentUser.email.split('@')[0].toUpperCase() : "FOYDALANUVCHI";

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl font-bold text-gray-500">Ma'lumotlar yuklanmoqda...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Chap tomon: Shaxsiy ma'lumotlar (Kabinet) */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 text-center sticky top-6">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl font-bold mx-auto mb-4 shadow-inner">
              {displayName.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-gray-800 break-all">{currentUser?.email}</h2>
            <p className="text-gray-500 mb-6 text-sm mt-1">Shaxsiy kabinet</p>
            
            <div className="flex flex-col gap-3">
              <button className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition">
                Ma'lumotlarni tahrirlash
              </button>
              <button 
                onClick={handleLogout}
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition"
              >
                Tizimdan chiqish
              </button>
            </div>
          </div>
        </div>

        {/* O'ng tomon: Sayohat tarixi */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Mening sayohatlarim</h2>
          
          <div className="space-y-4">
            {travelHistory.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-center text-gray-500">
                Sizda hozircha hech qanday chipta mavjud emas. <br/>
                <button onClick={() => navigate('/')} className="mt-4 text-blue-600 font-bold hover:underline">Yo'nalishlarni izlash</button>
              </div>
            ) : (
              travelHistory.map((trip) => (
                <div key={trip.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row justify-between md:items-center border-b pb-4 mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚌</span>
                      <div>
                        <p className="font-bold text-gray-800 text-lg">
                          {trip.from} ➔ {trip.to}
                        </p>
                        <p className="text-sm text-gray-500">Ketish sanasi: {trip.date}</p>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        trip.status === 'Kutilmoqda' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {trip.status}
                      </span>
                      <p className="text-xs text-gray-400 mt-2" title={trip.id}>Chipta ID: {trip.id.substring(0, 8).toUpperCase()}...</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-gray-500">Avtobus: </span>
                      <span className="font-medium text-gray-800 mr-4">{trip.busModel}</span> <br className="md:hidden" />
                      
                      {/* O'rindiq: Ham eski (seats) ham yangi (seatNumber) ni tekshiradi */}
                      <span className="text-gray-500">O'rindiqlar: </span>
                      <span className="font-bold text-gray-800">
                        {trip.seats ? trip.seats.join(', ') : trip.seatNumber}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 block md:inline">To'langan: </span>
                      
                      {/* Narx: Ham eski (totalPrice) ham yangi (price) ni tekshiradi */}
                      <span className="font-black text-blue-600 text-lg">
                        {(trip.totalPrice || trip.price || 0).toLocaleString()} so'm
                      </span>
                    </div>
                  </div>

                  {/* Yangi tizimdagi yo'lovchi ismini ham ko'rsatib qo'yamiz (ixtiyoriy) */}
                  {trip.passengerName && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-100">
                      <span className="text-gray-500 text-xs uppercase font-bold">Yo'lovchi:</span>
                      <span className="text-gray-800 text-sm font-medium ml-2">{trip.passengerName}</span>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;