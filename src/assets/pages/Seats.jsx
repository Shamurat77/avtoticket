import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Seats = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { route, date } = location.state || {};
  
  const ticketPrice = route ? Number(route.price) : 0; 
  
  // YANGI MANTIQ: Bazadagi ma'lumotlarni o'qiymiz. Agar ma'lumot yo'q bo'lsa, xatolik bermasligi uchun default qiymatlar beramiz.
  const totalSeats = route?.totalSeats ? Number(route.totalSeats) : 36;
  const bookedSeats = route?.bookedSeats ? route.bookedSeats : []; 
  
  const [selectedSeats, setSelectedSeats] = useState([]);

  const handleSeatClick = (seat) => {
    if (bookedSeats.includes(seat)) return; 

    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seat));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const totalPrice = selectedSeats.length * ticketPrice;

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        
        <div className="flex flex-col items-center">
          <div className="bg-white border-4 border-gray-300 p-6 rounded-t-3xl rounded-b-lg shadow-lg w-full max-w-[320px]">
            <div className="flex justify-end mb-8 pb-4 border-b-2 border-gray-200">
              <div className="w-12 h-12 border-4 border-gray-400 rounded-full flex items-center justify-center">
                <div className="w-8 h-2 bg-gray-400 rounded"></div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-y-4 gap-x-2">
              {Array.from({ length: totalSeats }, (_, i) => i + 1).map((seat) => {
                const isBooked = bookedSeats.includes(seat);
                const isSelected = selectedSeats.includes(seat);

                return (
                  <React.Fragment key={seat}>
                    <button
                      onClick={() => handleSeatClick(seat)}
                      disabled={isBooked}
                      className={`
                        w-10 h-10 rounded-t-lg rounded-b-sm font-bold text-sm flex items-center justify-center transition-all duration-200 shadow-sm
                        ${isBooked ? 'bg-red-100 text-red-400 border border-red-200 cursor-not-allowed' : ''}
                        ${isSelected ? 'bg-blue-600 text-white shadow-blue-300 transform scale-110' : ''}
                        ${!isBooked && !isSelected ? 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 hover:border-gray-400' : ''}
                      `}
                    >
                      {seat}
                    </button>
                    {/* O'rtadagi yo'lakcha */}
                    {seat % 4 === 2 && <div className="w-6"></div>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl h-fit border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Chipta ma'lumotlari</h2>
          
          {route && (
            <div className="mb-6 p-5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-900 space-y-3">
              <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                <span className="font-semibold text-gray-500">Yo'nalish:</span>
                <span className="font-bold text-lg">{route.from} ➔ {route.to}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-500">Sana:</span>
                <span className="font-medium">{date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-500">Avtobus:</span>
                <span className="font-medium">{route.busModel} ({totalSeats} o'rinli)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-500">Haydovchi:</span>
                <span className="font-medium">{route.driverName}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between mb-8 text-sm font-medium text-gray-600 px-2">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-200 border rounded"></div> Bo'sh</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div> Band</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-600 rounded"></div> Tanlandi</div>
          </div>

          <div className="space-y-4 border-t border-gray-200 pt-6">
            <div className="flex justify-between text-gray-600">
              <span>Bitta chipta narxi:</span>
              <span className="font-bold">{ticketPrice.toLocaleString()} so'm</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tanlangan o'rindiqlar:</span>
              <span className="font-bold text-blue-600">{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Tanlanmagan'}</span>
            </div>
            <div className="flex justify-between text-xl text-gray-900 border-t border-gray-200 pt-4 font-black">
              <span>Umumiy summa:</span>
              <span className="text-blue-700">{totalPrice.toLocaleString()} so'm</span>
            </div>
          </div>

          <button 
            onClick={() => navigate('/checkout', { state: { selectedSeats, totalPrice, route, date } })}
            disabled={selectedSeats.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-lg mt-8 transition duration-300
              ${selectedSeats.length > 0 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {selectedSeats.length > 0 ? 'Rasmiylashtirishga o\'tish' : 'O\'rindiq tanlang'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Seats;