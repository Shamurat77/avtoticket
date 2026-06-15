import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { doc, updateDoc, arrayUnion, collection, addDoc } from 'firebase/firestore';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { selectedSeats, totalPrice, route, date } = location.state || { selectedSeats: [], totalPrice: 0 };
  
  const [paymentMethod, setPaymentMethod] = useState('Uzcard');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Karta ma'lumotlari uchun holatlar
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // YANGI: SMS kod (OTP) uchun holatlar
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  
  const [passengersData, setPassengersData] = useState(
    selectedSeats.reduce((acc, seat) => {
      acc[seat] = { fullName: '', dob: '', passport: '', phone: '' };
      return acc;
    }, {})
  );

  const handleInputChange = (seat, field, value) => {
    setPassengersData(prev => ({
      ...prev,
      [seat]: { ...prev[seat], [field]: value }
    }));
  };

  // Karta raqamini 0000 0000 0000 0000 formatiga o'tkazish
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Faqat raqamlar
    val = val.replace(/(.{4})/g, '$1 ').trim(); // Har 4 ta raqamdan keyin probel
    setCardNumber(val);
  };

  // Amal qilish muddatiga avtomatik '/' qo'shish funksiyasi
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); 
    if (val.length >= 3) {
      val = val.slice(0, 2) + '/' + val.slice(2, 4);
    }
    setExpiryDate(val);
  };

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

  // 1-BOSQICH: Malumotlarni tekshirib, SMS oynasini ochish
  const handlePaymentInitiate = (e) => {
    e.preventDefault();
    
    // Karta raqami tekshiruvi (bo'sh joylarni olib tashlab 16 ta ekanligini sanaymiz)
    if (cardNumber.replace(/\s/g, '').length < 16) {
      alert("Karta raqamini to'liq kiriting!");
      return;
    }
    // Muddat tekshiruvi
    if (expiryDate.length < 5) {
      alert("Amal qilish muddatini to'liq kiriting!");
      return;
    }
    // CVV tekshiruvi (faqat Visa/Mastercard uchun)
    if ((paymentMethod === 'Visa' || paymentMethod === 'Mastercard') && cvv.length < 3) {
      alert("CVC / CVV kodini to'liq kiriting!");
      return;
    }

    // Hammasi joyida bo'lsa, SMS oynasini chiqaramiz
    setShowOtpModal(true);
    setOtpError('');
    setOtpCode('');
  };

  // 2-BOSQICH: SMS kodni tasdiqlash va Bazaga yozish
  const handleConfirmOTP = async () => {
    if (otpCode.length < 4) {
      setOtpError("SMS kod 4 xonali bo'lishi kerak!");
      return;
    }

    setOtpError('');
    setIsProcessing(true);

    try {
      // BAZAGA YOZISH JARAYONI (Sizning oldingi kodingizdek qolgan)
      const routeRef = doc(db, "routes", route.id);
      await updateDoc(routeRef, {
        bookedSeats: arrayUnion(...selectedSeats.map(Number)) 
      });

      const user = auth.currentUser;
      const ticketPromises = selectedSeats.map(seat => {
        const pData = passengersData[seat];
        return addDoc(collection(db, "tickets"), {
          userId: user ? user.uid : "mehmon",
          userEmail: user ? user.email : "Noma'lum",
          routeId: route.id,
          seatNumber: Number(seat),
          passengerName: pData.fullName,
          passengerPhone: pData.phone,
          passportSeries: pData.passport,
          dateOfBirth: pData.dob,
          from: route.from,
          to: route.to,
          date: date,
          driverName: route.driverName,
          busModel: route.busModel,
          price: route.price, 
          purchasedAt: new Date().toISOString()
        });
      });

      await Promise.all(ticketPromises);

      // Muvaffaqiyatli chipta oynasiga uzatamiz
      navigate('/ticket', { state: { selectedSeats, totalPrice } }); 
      
    } catch (error) {
      console.error("Xatolik yuz berdi:", error);
      setOtpError("Tizimda xatolik yuz berdi, qaytadan urinib ko'ring.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gray-50 py-10 px-4 relative">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CHAP TOMON: Yo'lovchi ma'lumotlari */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Yo'lovchi ma'lumotlari</h2>
            
            <form id="checkout-form" onSubmit={handlePaymentInitiate} className="space-y-6">
              {selectedSeats.map((seat, index) => (
                <div key={seat} className="p-5 border border-blue-100 rounded-xl bg-blue-50/30">
                  <h3 className="font-bold text-blue-600 mb-4">Yo'lovchi {index + 1} ({seat}-o'rindiq)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ism-sharifi</label>
                      <input type="text" required 
                        value={passengersData[seat].fullName}
                        onChange={(e) => handleInputChange(seat, 'fullName', e.target.value)}
                        placeholder="Masalan: Alisher Navoiy" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tug'ilgan yili</label>
                      <input type="date" required 
                        value={passengersData[seat].dob}
                        onChange={(e) => handleInputChange(seat, 'dob', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pasport seriya va raqami</label>
                      <input type="text" required 
                        value={passengersData[seat].passport}
                        onChange={(e) => handleInputChange(seat, 'passport', e.target.value)}
                        placeholder="AA 1234567" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bog'lanish uchun raqam</label>
                      <input type="text" required 
                        value={passengersData[seat].phone}
                        onChange={(e) => handleInputChange(seat, 'phone', e.target.value)}
                        placeholder="+998" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                    </div>
                  </div>
                </div>
              ))}
            </form>
          </div>
        </div>

        {/* O'NG TOMON: To'lov qismi */}
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
                    ${paymentMethod === method ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  {method}
                </button>
              ))}
            </div>

            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Karta raqami</label>
                <input 
                  type="text" 
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength="19" 
                  placeholder="0000 0000 0000 0000" 
                  required 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg tracking-widest font-mono" 
                />
              </div>
              
              <div className={`grid gap-4 ${paymentMethod === 'Visa' || paymentMethod === 'Mastercard' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amal qilish muddati</label>
                  <input 
                    type="text" 
                    maxLength="5" 
                    placeholder="OO/YY" 
                    required 
                    value={expiryDate}
                    onChange={handleExpiryChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg tracking-widest font-mono text-center" 
                  />
                </div>

                {(paymentMethod === 'Visa' || paymentMethod === 'Mastercard') && (
                  <div className="animate-fade-in-up">
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVC / CVV</label>
                    <input 
                      type="password" 
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                      maxLength="3" 
                      placeholder="***" 
                      required 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg tracking-widest font-mono text-center" 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
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
              {isProcessing ? "Kuting..." : "To'lovni tasdiqlash"}
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* YANGI: SMS KOD (OTP) TASDIQLASH OYNASI (MODAL)            */}
      {/* ========================================================= */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center relative">
            
            {/* Modal yopish tugmasi */}
            {!isProcessing && (
              <button 
                onClick={() => setShowOtpModal(false)} 
                className="absolute top-4 right-5 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            )}

            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl">💬</span>
            </div>
            
            <h2 className="text-2xl font-black text-gray-800 mb-2">Tasdiqlash kodi</h2>
            <p className="text-sm text-gray-500 mb-6">
              Xavfsizlik maqsadida telefon raqamingizga yuborilgan 4 xonali SMS kodni kiriting.
              (Hozircha ixtiyoriy 4 ta raqam kiriting)
            </p>

            <div className="mb-6">
              <input 
                type="text" 
                maxLength="4" 
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, ''));
                  setOtpError('');
                }}
                placeholder="0 0 0 0"
                className="w-full text-center text-3xl tracking-[1em] font-mono py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none"
              />
              {otpError && <p className="text-red-500 text-sm mt-2 font-medium">{otpError}</p>}
            </div>

            <button 
              onClick={handleConfirmOTP}
              disabled={isProcessing || otpCode.length < 4}
              className={`w-full py-4 rounded-xl font-bold text-white transition shadow-lg ${
                isProcessing || otpCode.length < 4 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              {isProcessing ? "To'lov o'tkazilmoqda..." : "Tasdiqlash va To'lash"}
            </button>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default Checkout;