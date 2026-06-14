import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// Firebase kutubxonalari
import { db, auth } from '../../firebase';
import { doc, updateDoc, arrayUnion, collection, addDoc } from 'firebase/firestore';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Seats sahifasidan kelgan barcha ma'lumotlarni qabul qilib olamiz
  const { selectedSeats, totalPrice, route, date } = location.state || { selectedSeats: [], totalPrice: 0 };
  
  const [paymentMethod, setPaymentMethod] = useState('uzcard');
  const [isProcessing, setIsProcessing] = useState(false); // Yuklanish jarayoni uchun

  // Agar to'g'ridan-to'g'ri (o'rindiq tanlamasdan) bu sahifaga kirsa, orqaga qaytarish
  if (selectedSeats.length === 0 || !route) {
    return (
      <div className="p-10 text-center mt-20">
        <h2 className="text-2xl font-bold text-red-500 mb-4">O'rindiq yoki yo'nalish tanlanmagan!</h2>
        <button onClick={() => navigate('/seats')} className="text-blue-600 hover:underline">
          O'rindiq tanlash sahifasiga qaytish
        </button>
      </div>
    );
  }

  // To'lovni amalga oshirish va BAZAGA saqlash funksiyasi
  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true); // Tugmani bloklab turamiz

    try {
      // 1-QADAM: "routes" bazasiga kirib, tanlangan o'rindiqlarni band qilinganlar ro'yxatiga (bookedSeats) qo'shamiz
      const routeRef = doc(db, "routes", route.id);
      await updateDoc(routeRef, {
        // arrayUnion - mavjud massivni o'chirib tashlamasdan, ustiga yangisini qo'shadi
        bookedSeats: arrayUnion(...selectedSeats) 
      });

      // 2-QADAM: "tickets" kolleksiyasiga foydalanuvchining chiptasini saqlaymiz
      const user = auth.currentUser; // Hozirgi tizimga kirgan foydalanuvchi
      
      await addDoc(collection(db, "tickets"), {
        userId: user ? user.uid : "mehmon", // Profilga ulash uchun kerak
        userEmail: user ? user.email : "Noma'lum",
        routeId: route.id,
        from: route.from,
        to: route.to,
        date: date,
        driverName: route.driverName,
        busModel: route.busModel,
        seats: selectedSeats,
        totalPrice: totalPrice,
        purchasedAt: new Date()
      });

      alert("To'lov muvaffaqiyatli amalga oshirildi! Chiptangiz tayyor.");
      
      // To'lovdan so'ng darhol foydalanuvchining Profil sahifasiga o'tkazib yuboramiz
      navigate('/profile'); 
      
    } catch (error) {
      console.error("Xatolik yuz berdi:", error);
      alert("To'lovni amalga oshirishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chap tomon: Yo'lovchi ma'lumotlari */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Yo'lovchi ma'lumotlari</h2>
            
            <form id="checkout-form" onSubmit={handlePayment} className="space-y-6">
              {selectedSeats.map((seat, index) => (
                <div key={seat} className="p-5 border border-blue-100 rounded-xl bg-blue-50/30">
                  <h3 className="font-bold text-blue-600 mb-4">Yo'lovchi {index + 1} ({seat}-o'rindiq)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ism-sharifi</label>
                      <input type="text" required placeholder="Masalan: Alisher Navoiy" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tug'ilgan yili</label>
                      <input type="date" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pasport seriya va raqami</label>
                      <input type="text" required placeholder="AA 1234567" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bog'lanish uchun raqam</label>
                      <input type="text" required placeholder="+998" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                    </div>
                  </div>
                </div>
              ))}
            </form>
          </div>
        </div>

        {/* O'ng tomon: To'lov tizimi */}
        <div>
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-gray-100 sticky top-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">To'lov usulini tanlang</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {['Uzcard', 'Humo', 'Visa', 'Mastercard'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-3 border rounded-xl font-bold uppercase text-sm transition-all duration-200 
                    ${paymentMethod === method 
                      ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  {method}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Karta raqami</label>
              <input 
                type="text" 
                maxLength="16"
                placeholder="0000 0000 0000 0000" 
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg tracking-widest font-mono" 
              />
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-gray-600 mb-2">
                <span>Chiptalar soni:</span>
                <span className="font-medium">{selectedSeats.length} ta</span>
              </div>
              <div className="flex justify-between text-xl font-black text-gray-900 mt-2">
                <span>Jami to'lov:</span>
                <span className="text-blue-600">{totalPrice.toLocaleString()} so'm</span>
              </div>
            </div>

            <button 
              type="submit" 
              form="checkout-form" 
              disabled={isProcessing}
              className={`w-full font-bold py-4 rounded-xl shadow-lg transition duration-300 ${
                isProcessing ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
              }`}
            >
              {isProcessing ? "Kuting, band qilinmoqda..." : "To'lovni tasdiqlash"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;