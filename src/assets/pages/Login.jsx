import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Inputlardan keladigan ma'lumotlarni saqlash
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(''); // YANGI: Telefon raqam qo'shildi
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Forma yuborilganda ishlaydigan Asosiy funksiya
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // 1. TIZIMGA KIRISH (LOGIN) - AQLLI YO'NALTIRISH BILAN
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Foydalanuvchining bazadagi ma'lumotlarini (rolini) o'qib kelamiz
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Roliga qarab kerakli sahifaga otib yuboramiz
          if (userData.role === 'admin') {
            navigate('/admin');
          } else if (userData.role === 'driver') {
            navigate('/driver'); // Haydovchi o'z paneliga tushadi
          } else {
            navigate('/profile'); // Yo'lovchi o'z tarixiga tushadi
          }
        } else {
          navigate('/profile'); // Agar roliga oid ma'lumot topilmasa, default profilga
        }

        if(onLogin) onLogin(); 

      } else {
        // 2. YO'LOVCHI SIFATIDA RO'YXATDAN O'TISH
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Ro'yxatdan o'tgan foydalanuvchini bazaga (users jadvaliga) saqlaymiz
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          fullName: name, // Haydovchilar bilan bir xil formatda bo'lishi uchun
          phone: phone,   // Admin ko'rishi uchun qo'shildi
          email: email,
          role: 'user',   // Demak, bu oddiy yo'lovchi
          createdAt: new Date()
        });

        if(onLogin) onLogin();
        navigate('/profile'); // Yangi yo'lovchini profiliga o'tkazamiz
      }
    } catch (err) {
      console.error(err);
      setError("Xatolik yuz berdi. Parol xato bo'lishi yoki bunday foydalanuvchi mavjud emasligini tekshiring.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex justify-center items-center min-h-[calc(100vh-70px)] bg-gray-100 px-4'>
      <div className='bg-white p-8 rounded-2xl shadow-xl w-full max-w-md'>
        
        <h2 className='text-3xl font-black text-center mb-6 text-blue-600'>
          {isLogin ? 'Tizimga kirish' : "Ro'yxatdan o'tish"}
        </h2>

        {/* Xatolik bo'lsa qizil rangda ko'rsatish */}
        {error && (
          <div className='bg-red-100 text-red-600 p-3 rounded-lg text-sm mb-4'>
            {error}
          </div>
        )}

        <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
          
          {/* Ro'yxatdan o'tish vaqtidagi qo'shimcha maydonlar */}
          {!isLogin && (
            <>
              <div>
                <label className='text-sm font-medium text-gray-700'>Ism-sharifingiz</label>
                <input
                  type='text'
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder='Masalan: Alisher Navoiy'
                  className='w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition'
                />
              </div>
              <div>
                <label className='text-sm font-medium text-gray-700'>Telefon raqamingiz</label>
                <input
                  type='text'
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder='+998901234567'
                  className='w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition'
                />
              </div>
            </>
          )}

          <div>
            <label className='text-sm font-medium text-gray-700'>Elektron pochta</label>
            <input
              type='email'
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='example@gmail.com'
              className='w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition'
            />
          </div>

          <div>
            <label className='text-sm font-medium text-gray-700'>Parol</label>
            <input
              type='password'
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='••••••••'
              minLength='6'
              className='w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition'
            />
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className={`w-full text-white font-bold py-3 rounded-lg mt-2 transition duration-300 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLoading ? 'Iltimos, kuting...' : (isLogin ? 'Kirish' : "Ro'yxatdan o'tish")}
          </button>
        </form>

        <div className='text-center mt-6 text-sm text-gray-600 flex flex-col gap-2'>
          <div>
            {isLogin ? "Akkauntingiz yo'qmi?" : "Allaqachon ro'yxatdan o'tganmisiz?"}{' '}
            <button
              type='button'
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className='text-blue-600 font-bold hover:underline'
            >
              {isLogin ? "Ro'yxatdan o'tish" : 'Tizimga kirish'}
            </button>
          </div>
          
          {/* Haydovchilar uchun maxsus ssilka */}
          {isLogin && (
            <div className='mt-2 pt-2 border-t text-xs'>
              Avtobusingiz bormi? <span onClick={() => navigate('/driver-register')} className="text-green-600 font-bold cursor-pointer hover:underline">Haydovchi bo'lish</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Login;