import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const highways = [
  ["Toshkent shahri", "Sirdaryo tumani", "Oqoltin", "Sayxunobod", "Mirzaobod", "Sharof Rashidov", "G‘allaorol", "Bulung‘ur", "Jomboy", "Samarqand", "Oqdaryo", "Ishtixon", "Kattaqo‘rg‘on", "Paxtachi", "Xatirchi", "Karmana", "Qiziltepa", "G‘ijduvon", "Vobkent", "Peshku", "Buxoro", "Jondor", "Romitan", "Tuproqqal’a", "To‘rtko‘l", "Beruniy", "Amudaryo", "Nukus"],
  ["Toshkent shahri", "Sirdaryo tumani", "Oqoltin", "Sayxunobod", "Mirzaobod", "Sharof Rashidov", "G‘allaorol", "Bulung‘ur", "Jomboy", "Samarqand", "Oqdaryo", "Ishtixon", "Kattaqo‘rg‘on", "Paxtachi", "Xatirchi", "Karmana", "Qiziltepa", "G‘ijduvon", "Vobkent", "Peshku", "Buxoro", "Jondor", "Romitan", "Tuproqqal’a", "To‘rtko‘l", "Beruniy", "Urganch", "Xiva", "Shovot", "Gurlan"],
  ["Toshkent shahri", "Sirdaryo tumani", "Oqoltin", "Sayxunobod", "Mirzaobod", "Sharof Rashidov", "G‘allaorol", "Bulung‘ur", "Jomboy", "Samarqand", "Oqdaryo", "Ishtixon", "Kattaqo‘rg‘on", "Paxtachi", "Xatirchi", "Karmana", "Qiziltepa", "G‘ijduvon", "Vobkent", "Peshku", "Buxoro", "Jondor", "Qorako'l", "Olot"],
  ["Toshkent shahri", "Sirdaryo tumani", "Sayxunobod", "Guliston", "Mirzaobod", "Sharof Rashidov", "G‘allaorol", "Bulung‘ur", "Jomboy", "Samarqand", "Pastdarg‘om", "Nurobod", "Kitob", "Shahrisabz", "Yakkabog‘", "Qamashi", "G‘uzor", "Dehqonobod", "Boysun", "Bandixon", "Sherobod", "Angor", "Termiz"],
  ["Toshkent shahri", "Pop", "Chust", "Namangan", "Qo'qon", "Farg'ona", "Marg'ilon", "Asaka", "Andijon"]
];

// Oylarni o'zbekchada chiroyli chiqarish uchun
const months = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

const Trips = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Home.jsx dan kelgan qidiruv ma'lumotlari
  const { searchFrom, searchTo, searchDate } = location.state || {};

  const [allMatchedRoutes, setAllMatchedRoutes] = useState([]);
  const [activeDate, setActiveDate] = useState(searchDate || new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!searchFrom || !searchTo) {
      navigate('/');
      return;
    }

    const fetchRoutes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "routes"));
        const routesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // TRASSA ALGORITMI (Faqat mos yo'nalishlarni ajratib olamiz, barcha sanalar uchun)
        const matched = routesData.filter(route => {
          let isMatch = false;
          for (let hw of highways) {
            const uFromIdx = hw.indexOf(searchFrom);
            const uToIdx = hw.indexOf(searchTo);
            const dFromIdx = hw.indexOf(route.from);
            const dToIdx = hw.indexOf(route.to);

            if (uFromIdx !== -1 && uToIdx !== -1 && dFromIdx !== -1 && dToIdx !== -1) {
              const isUserGoingForward = uToIdx > uFromIdx;
              const isDriverGoingForward = dToIdx > dFromIdx;

              if (isUserGoingForward === isDriverGoingForward) {
                if (isDriverGoingForward) {
                  if (dFromIdx <= uFromIdx && dToIdx >= uToIdx) isMatch = true;
                } else {
                  if (dFromIdx >= uFromIdx && dToIdx <= uToIdx) isMatch = true;
                }
              }
            }
          }
          if (!isMatch && route.from === searchFrom && route.to === searchTo) isMatch = true;
          return isMatch;
        });

        setAllMatchedRoutes(matched);
      } catch (error) {
        console.error("Xato:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, [searchFrom, searchTo, navigate]);

  // Sanalar kalendarini yaratish (-2 kundan +2 kungacha)
  const generateDateTabs = () => {
    const tabs = [];
    const baseDate = new Date(activeDate);
    for (let i = -2; i <= 2; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Shu sanada nechta reys borligini sanaymiz
      const count = allMatchedRoutes.filter(r => r.date === dateStr).length;
      
      tabs.push({
        dateFull: dateStr,
        day: d.getDate(),
        month: months[d.getMonth()],
        count: count
      });
    }
    return tabs;
  };

  const currentDayRoutes = allMatchedRoutes.filter(r => r.date === activeDate);
  const dateTabs = generateDateTabs();

  const handleSelectRoute = (route) => {
    navigate('/seats', { 
      state: { route, date: route.date, searchFrom, searchTo } 
    });
  };

  if (loading) return <div className="text-center mt-20 text-xl font-bold">Qidirilmoqda...</div>;

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gray-50 flex flex-col items-center pt-8 px-4 pb-20">
      
      {/* Yuqori Qidiruv paneli (Faqat ko'rsatish uchun) */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-4 mb-10 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex-1 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold">
          Qayerdan: <span className="text-blue-600">{searchFrom}</span>
        </div>
        <div className="flex-1 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold">
          Qayerga: <span className="text-blue-600">{searchTo}</span>
        </div>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-xl transition">
          O'zgartirish
        </button>
      </div>

      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-black text-gray-800 mb-6">Reysni tanlash</h1>

        {/* Sanalar qatori (Tabs) */}
        <div className="flex overflow-x-auto gap-2 mb-8 hide-scrollbar">
          {dateTabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveDate(tab.dateFull)}
              className={`shrink-0 min-w-30 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200
                ${activeDate === tab.dateFull 
                  ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'}`}
            >
              <span className={`text-lg font-black ${activeDate === tab.dateFull ? 'text-white' : 'text-gray-800'}`}>
                {tab.day} {tab.month}
              </span>
              <span className={`text-sm mt-1 font-medium ${activeDate === tab.dateFull ? 'text-blue-100' : 'text-gray-400'}`}>
                {tab.count} ta reys
              </span>
            </button>
          ))}
        </div>

        {/* Avtobuslar Ro'yxati */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Jadval Sarlavhalari (Faqat katta ekranlarda ko'rinadi) */}
          <div className="hidden md:grid grid-cols-5 p-4 bg-gray-50 border-b border-gray-200 text-sm font-bold text-gray-500 uppercase tracking-wider">
            <div className="col-span-2">Reys nomi va Vaqti</div>
            <div className="text-center">Bo'sh o'rin</div>
            <div className="text-center">Tarif (so'm)</div>
            <div className="text-right">Avtobus / Haydovchi</div>
          </div>

          {currentDayRoutes.length === 0 ? (
            <div className="p-10 text-center text-gray-500 font-medium">
              Bu sanada qatnovlar topilmadi. Boshqa sanani tanlab ko'ring.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {currentDayRoutes.map(route => {
                // Bo'sh o'rinlarni hisoblash
                const soldSeats = route.bookedSeats?.length || 0;
                const availableSeats = route.totalSeats - soldSeats;

                return (
                  <div 
                    key={route.id} 
                    onClick={() => handleSelectRoute(route)}
                    className="grid grid-cols-1 md:grid-cols-5 p-5 items-center hover:bg-blue-50/50 cursor-pointer transition duration-200 gap-4 md:gap-0"
                  >
                    {/* Reys va Vaqt */}
                    <div className="col-span-2 flex flex-col">
                      <span className="font-bold text-lg text-gray-800">{route.from} — {route.to}</span>
                      <span className="text-sm text-gray-500 mt-0.5 font-medium flex items-center gap-2">
                         📅 {route.date}
                      </span>
                    </div>

                    {/* Bo'sh o'rinlar */}
                    <div className="text-left md:text-center flex flex-col">
                      <span className="md:hidden text-xs text-gray-400 font-bold uppercase mb-1">Bo'sh o'rinlar</span>
                      <span className="font-black text-xl text-blue-600">{availableSeats}</span>
                    </div>

                    {/* Narx */}
                    <div className="text-left md:text-center flex flex-col">
                      <span className="md:hidden text-xs text-gray-400 font-bold uppercase mb-1">Narxi</span>
                      <span className="font-black text-xl text-green-600">{route.price.toLocaleString()}</span>
                    </div>

                    {/* Avtobus va Haydovchi */}
                    <div className="text-left md:text-right flex flex-col">
                      <span className="md:hidden text-xs text-gray-400 font-bold uppercase mb-1">Avtobus / Haydovchi</span>
                      <span className="font-bold text-gray-800">{route.busModel}</span>
                      <span className="text-sm text-gray-500 mt-0.5">{route.driverName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Trips;