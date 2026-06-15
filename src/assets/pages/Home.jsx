import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// 2. DIZAYN UCHUN GURUHLANGAN RO'YXAT (Viloyat -> Tuman)
const regionsData = {
  Toshkent: ['Toshkent shahri'],
  Sirdaryo: [
    'Sirdaryo tumani',
    'Oqoltin',
    'Sayxunobod',
    'Mirzaobod',
    'Guliston'
  ],
  Jizzax: ['Sharof Rashidov', 'G‘allaorol'],
  Samarqand: [
    'Bulung‘ur',
    'Jomboy',
    'Samarqand',
    'Oqdaryo',
    'Ishtixon',
    'Kattaqo‘rg‘on',
    'Paxtachi',
    'Pastdarg‘om',
    'Nurobod'
  ],
  Navoiy: ['Xatirchi', 'Karmana', 'Qiziltepa'],
  Buxoro: [
    'G‘ijduvon',
    'Vobkent',
    'Peshku',
    'Buxoro',
    'Jondor',
    'Romitan',
    "Qorako'l",
    'Olot'
  ],
  Xorazm: ['Tuproqqal’a', 'Urganch', 'Xiva', 'Shovot', 'Gurlan'],
  "Qoraqalpog'iston Res...": ['To‘rtko‘l', 'Beruniy', 'Amudaryo', 'Nukus'],
  Qashqadaryo: [
    'Kitob',
    'Shahrisabz',
    'Yakkabog‘',
    'Qamashi',
    'G‘uzor',
    'Dehqonobod'
  ],
  Surxondaryo: ['Boysun', 'Bandixon', 'Sherobod', 'Angor', 'Termiz'],
  Namangan: ['Pop', 'Chust', 'Namangan'],
  "Farg'ona": ["Qo'qon", "Farg'ona", "Marg'ilon"],
  Andijon: ['Asaka', 'Andijon']
}

const Home = () => {
  const navigate = useNavigate()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [activeRegion, setActiveRegion] = useState(null)

  // Chiroyli bildirishnoma (Toast) uchun holat
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'error'
  })

  // Bildirishnomani ko'rsatish va 4 soniyadan keyin o'chirish funksiyasi
  const showNotification = (message, type = 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'error' })
    }, 4000)
  }

  const handleSearch = e => {
    e.preventDefault()

    // 1. Maydonlar to'ldirilganini tekshiramiz
    if (!from || !to || !date) {
      showNotification("Iltimos, barcha qidiruv maydonlarini to'ldiring!")
      return
    }

    // 2. Bir xil joy tanlanmaganini tekshiramiz
    if (from === to) {
      showNotification("Jo'nash va borish manzili bir xil bo'lishi mumkin emas!")
      return
    }

    // 3. To'g'ridan-to'g'ri Trips sahifasiga yo'naltiramiz
    navigate('/trips', {
      state: { searchFrom: from, searchTo: to, searchDate: date }
    })
  }

  const openModal = type => {
    setModalType(type)
    setActiveRegion(null)
    setModalOpen(true)
  }

  const handleSelectDistrict = district => {
    if (modalType === 'from') setFrom(district)
    else setTo(district)
    setModalOpen(false)
  }

  return (
    <div className='min-h-[calc(100vh-70px)] bg-gray-50 flex flex-col items-center pt-10 md:pt-20 px-4 relative overflow-hidden'>
      
      {/* TOAST BILDIRISHNOMA */}
      <div
        className={`fixed top-24 right-5 z-100 transition-all duration-500 transform ${
          toast.show
            ? 'translate-x-0 opacity-100'
            : 'translate-x-32 opacity-0 pointer-events-none'
        }`}
      >
        <div className='flex items-center bg-white border-l-4 border-red-500 p-4 rounded-xl shadow-2xl min-w-75'>
          <div className='text-red-500 text-2xl mr-4'>⚠️</div>
          <div className='flex-1'>
            <h4 className='text-gray-900 font-bold text-sm'>Diqqat</h4>
            <p className='text-gray-600 text-xs mt-0.5 leading-relaxed'>
              {toast.message}
            </p>
          </div>
          <button
            onClick={() =>
              setToast({ show: false, message: '', type: 'error' })
            }
            className='ml-4 text-gray-400 hover:text-gray-800 transition'
          >
            ✕
          </button>
        </div>
      </div>

      <div className='text-center mb-10'>
        <h1 className='text-4xl md:text-5xl font-black text-blue-700 mb-4 tracking-tight'>
          AvtoTicket orqali oson sayohat
        </h1>
        <p className='text-lg text-gray-500 font-medium'>
          O'zbekiston bo'ylab avtobus chiptalarini onlayn xarid qiling
        </p>
      </div>

      <div className='bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-5xl border border-gray-100 z-10'>
        <form
          onSubmit={handleSearch}
          className='flex flex-col md:flex-row gap-4 items-end'
        >
          <div className='w-full md:w-1/3'>
            <label className='block text-sm font-bold text-gray-700 mb-2'>
              Qayerdan
            </label>
            <div
              onClick={() => openModal('from')}
              className={`w-full px-4 py-3.5 border rounded-xl cursor-pointer flex justify-between items-center transition ${
                from
                  ? 'border-blue-500 bg-blue-50/30'
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span
                className={from ? 'text-gray-900 font-medium' : 'text-gray-400'}
              >
                {from || 'Viloyat yoki tumanni tanlang'}
              </span>
              <span className='text-gray-400'>▼</span>
            </div>
          </div>

          <div className='w-full md:w-1/3'>
            <label className='block text-sm font-bold text-gray-700 mb-2'>
              Qayerga
            </label>
            <div
              onClick={() => openModal('to')}
              className={`w-full px-4 py-3.5 border rounded-xl cursor-pointer flex justify-between items-center transition ${
                to
                  ? 'border-blue-500 bg-blue-50/30'
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span
                className={to ? 'text-gray-900 font-medium' : 'text-gray-400'}
              >
                {to || 'Viloyat yoki tumanni tanlang'}
              </span>
              <span className='text-gray-400'>▼</span>
            </div>
          </div>

          <div className='w-full md:w-1/4'>
            <label className='block text-sm font-bold text-gray-700 mb-2'>
              Sana
            </label>
            <input
              type='date'
              value={date}
              onChange={e => setDate(e.target.value)}
              className='w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              required
            />
          </div>

          <div className='w-full md:w-auto mt-4 md:mt-0'>
            <button
              type='submit'
              className='w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md'
            >
              <span className='text-xl'>🚌</span> <span>Qidirish</span>
            </button>
          </div>
        </form>
      </div>

      {/* MODAL (QALQIB CHIQUVCHI OYNA) */}
      {modalOpen && (
        <div className='fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-up'>
            <div className='p-5 border-b flex justify-between items-center bg-gray-50'>
              <div className='flex items-center gap-3'>
                {activeRegion ? (
                  <button
                    onClick={() => setActiveRegion(null)}
                    className='flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition'
                  >
                    <span>←</span> Hududga qaytish
                  </button>
                ) : (
                  <h3 className='text-xl font-bold text-gray-800'>
                    Hududni tanlang
                  </h3>
                )}
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className='text-gray-400 hover:text-red-500 text-2xl font-bold leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition'
              >
                ×
              </button>
            </div>

            <div className='p-6 overflow-y-auto'>
              {!activeRegion ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
                  {Object.keys(regionsData).map(region => (
                    <button
                      key={region}
                      onClick={() => setActiveRegion(region)}
                      className='p-4 border border-gray-200 rounded-xl text-left hover:border-blue-500 hover:shadow-md hover:bg-blue-50/50 transition duration-200 font-medium text-gray-700'
                    >
                      {region}
                    </button>
                  ))}
                </div>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
                  {regionsData[activeRegion].map(district => (
                    <button
                      key={district}
                      onClick={() => handleSelectDistrict(district)}
                      className='p-4 border border-gray-200 rounded-xl text-left hover:border-green-500 hover:shadow-md hover:bg-green-50/50 transition duration-200 font-bold text-gray-800'
                    >
                      {district}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home