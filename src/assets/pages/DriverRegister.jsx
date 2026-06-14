import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const DriverAuth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); // Boshlang'ich holat: Kirish
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', password: '', busModel: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // --- HAYDOVCHI SIFATIDA KIRISH ---
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // BAZADAN TEKSHIRAMIZ: U rostdan ham haydovchimi?
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().role === 'driver') {
          navigate('/driver'); // Hammasi joyida, kabinetga o'tadi
        } else {
          // Agar u oddiy yo'lovchi bo'lsa, tizimdan chiqarib, xato beramiz
          await signOut(auth);
          setError("Siz haydovchi emassiz! Iltimos, yo'lovchilar oynasidan kiring.");
        }

      } else {
        // --- YANGI HAYDOVCHI RO'YXATDAN O'TISHI ---
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          busModel: formData.busModel,
          role: 'driver', // Haydovchi maqomi
          createdAt: new Date()
        });

        alert("Haydovchi sifatida muvaffaqiyatli ro'yxatdan o'tdingiz!");
        navigate('/driver');
      }
    } catch (err) {
      console.error(err);
      setError("Xatolik yuz berdi. Ma'lumotlarni tekshirib qaytadan urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gray-50 flex justify-center items-center py-10 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🚌</div>
          <h1 className="text-2xl font-black text-green-600">Haydovchilar paneli</h1>
          <p className="text-gray-500 text-sm">{isLogin ? "Tizimga kirish" : "O'z avtobusingizni tizimga qo'shing"}</p>
        </div>

        {error && <p className="bg-red-100 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Faqat ro'yxatdan o'tishda chiqadigan maydonlar */}
          {!isLogin && (
            <>
              <div>
                <label className="text-sm font-bold text-gray-700">Ism-sharifingiz</label>
                <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none" placeholder="Masalan: Eshmat Toshmatov" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Telefon raqam</label>
                <input type="text" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none" placeholder="+998901234567" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Avtobus rusumi</label>
                <input type="text" required value={formData.busModel} onChange={(e) => setFormData({...formData, busModel: e.target.value})} className="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none" placeholder="Yutong (45 o'rinli)" />
              </div>
            </>
          )}

          {/* Doim chiqadigan maydonlar (Kirish va Ro'yxatdan o'tish) */}
          <div>
            <label className="text-sm font-bold text-gray-700">Elektron pochta</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none" placeholder="haydovchi@gmail.com" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700">Parol</label>
            <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} minLength="6" className="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none" placeholder="******" />
          </div>

          <button type="submit" disabled={isLoading} className={`w-full text-white font-bold py-3.5 rounded-xl transition shadow-lg mt-2 ${isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
            {isLoading ? "Kuting..." : (isLogin ? "Tizimga kirish" : "Ro'yxatdan o'tish")}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-gray-100 text-sm text-gray-600">
          {isLogin ? "Tizimda yo'qmisiz?" : "Avval ro'yxatdan o'tganmisiz?"} <br/>
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-green-600 font-bold hover:underline mt-1">
            {isLogin ? "Ro'yxatdan o'tish" : "Tizimga kirish"}
          </button>
        </div>

        <div className="text-center mt-4 text-xs">
          Oddiy yo'lovchimisiz? <span onClick={() => navigate('/login')} className="text-blue-600 font-bold cursor-pointer hover:underline">Yo'lovchilar bo'limiga qaytish</span>
        </div>

      </div>
    </div>
  );
};

export default DriverAuth;