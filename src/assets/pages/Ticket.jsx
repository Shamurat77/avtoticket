import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const Ticket = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Checkout'dan kelgan ma'lumotlarni qabul qilish
  const { selectedSeats, totalPrice } = location.state || { selectedSeats: [], totalPrice: 0 };

  // Agar sahifaga to'g'ridan-to'g'ri (to'lovsiz) kirib qolsa
  if (selectedSeats.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Chipta topilmadi!</h2>
          <Link to="/" className="text-blue-600 font-bold hover:underline">Bosh sahifaga qaytish</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gray-100 flex items-center justify-center py-10 px-4">
      <div className="max-w-2xl w-full">
        
        {/* Muvaffaqiyatli to'lov xabari */}
        <div className="text-center mb-8 text-green-600">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-3xl font-black text-gray-800">To'lov muvaffaqiyatli!</h1>
          <p className="text-gray-500 font-medium mt-2">Sizning elektron chiptangiz tayyor</p>
        </div>

        {/* Chipta dizayni */}
        <div className="bg-white rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden border border-gray-200">
          
          {/* Asosiy ma'lumotlar qismi */}
          <div className="p-8 md:w-2/3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <span className="text-2xl font-black text-blue-600">AvtoTicket</span>
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">Standard</span>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Yo'lovchilar soni</p>
                  <p className="font-bold text-lg text-gray-800">{selectedSeats.length} ta</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">O'rindiqlar</p>
                  <p className="font-bold text-lg text-gray-800">{selectedSeats.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Jo'nash vaqti</p>
                  <p className="font-bold text-lg text-gray-800">20:00</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">To'langan summa</p>
                  <p className="font-bold text-lg text-blue-600">{totalPrice.toLocaleString()} so'm</p>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 mt-4">
              * Iltimos, avtobus jo'nashidan 30 daqiqa oldin bekatda bo'ling. Pasportingizni unutmang!
            </p>
          </div>

          {/* Uzuq-uzuq chiziq (Dashed border) */}
          <div className="hidden md:flex flex-col justify-center items-center px-0 relative">
            <div className="w-6 h-6 bg-gray-100 rounded-full absolute -top-3"></div>
            <div className="border-l-2 border-dashed border-gray-300 h-full"></div>
            <div className="w-6 h-6 bg-gray-100 rounded-full absolute -bottom-3"></div>
          </div>

          {/* QR kod va tasdiq qismi */}
          <div className="bg-blue-50 p-8 md:w-1/3 flex flex-col items-center justify-center border-t border-dashed border-gray-300 md:border-none">
            <p className="text-sm text-gray-500 mb-4 font-medium text-center">Chiptani tekshirish uchun QR-kod</p>
            {/* QR-kod o'rniga oddiy rasm/div joylaymiz */}
            <div className="w-32 h-32 bg-white border-2 border-blue-200 p-2 rounded-lg flex items-center justify-center relative shadow-sm">
               {/* Soddalashtirilgan QR naqsh imitatsiyasi */}
               <div className="w-full h-full border-4 border-black border-dashed flex items-center justify-center">
                 <div className="w-10 h-10 bg-black"></div>
               </div>
            </div>
            <p className="text-xs font-mono mt-4 text-gray-500">ID: AT-{Math.floor(Math.random() * 1000000)}</p>
          </div>

        </div>

        {/* Profilga o'tish tugmasi */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/profile')} 
            className="px-8 py-3 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition duration-300"
          >
            Sayohatlar tarixiga o'tish
          </button>
        </div>

      </div>
    </div>
  );
};

export default Ticket;