import React, { useState } from 'react';

const VerificationForm = ({ onVerify, correctCode }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,6}$/.test(value)) {
      setCode(value);
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError('الرجاء إدخال رمز التحقق المكون من 6 أرقام');
    } else if (!/^\d+$/.test(code)) {
      setError('الرجاء إدخال أرقام فقط');
    } else if (code !== correctCode) {
      setError('الرمز الذي أدخلته غير صحيح، الرجاء المحاولة مرة أخرى');
    } else {
      onVerify(code);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center">
      <h2 className="text-white text-2xl mb-4">أدخل رمز التحقق</h2>
      {error && <p className="text-red-500 text-xl mb-4">{error}</p>}
      <div className="flex justify-center mb-4">
        <input
          type="text"
          maxLength="6"
          value={code}
          onChange={handleChange}
          className="w-48 h-12 text-2xl text-center border-2 border-[#01939c] rounded-md bg-transparent text-white"
        />
      </div>
      <button
        type="submit"
        className="w-full py-2.5 px-0 text-xl font-normal bg-[#01939c] text-white rounded-2xl cursor-pointer transition-all duration-500 ease-in-out hover:bg-[#179b77]"
      >
        تحقق
      </button>
    </form>
  );
};

export default VerificationForm;