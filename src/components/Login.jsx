import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';
import FloatingInput from './FloatingInput';
import heroImage from '../assets/design_image_0.png';
import appleLogo from '../assets/apple.png';
import googleLogo from '../assets/google.png';
import metaLogo from '../assets/meta.png';
import openEye from '../assets/open_eye.png';
import closeEye from '../assets/close_eye.png';

export default function Login() {
  const { loginWithCredentials, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  // Guard must come AFTER all hooks — React requires consistent hook call order
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    setError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isFormFilled = form.email.trim() && form.password.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormFilled) return;
    const result = loginWithCredentials(form);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setToast({ message: 'Welcome back!', type: 'success' });
    setTimeout(() => navigate('/dashboard'), 1200);
  };

  return (
    <div className="relative min-h-screen w-full font-[Outfit,sans-serif] overflow-hidden">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Background */}
      <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
      <div className="absolute inset-0 bg-black/40 z-[1]" />

      {/* Content */}
      <div className="relative z-[2] flex min-h-screen max-lg:flex-col max-lg:min-h-0">

        {/* Left Panel */}
        <div className="w-1/2 flex flex-col justify-between px-14 py-10 max-lg:w-full max-lg:px-6 max-lg:py-6 max-lg:gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0CC8A8] flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
            <span className="text-xl font-medium tracking-tight text-white">aps</span>
          </div>

          {/* Hero */}
          <div>
            <h1 className="text-[35px] font-bold text-white leading-[1.18] tracking-tight m-0 mb-6">
              Expert level Cybersecurity
              <br />
              in <span className="text-[#0e9e9e]">hours</span> not weeks.
            </h1>
            <h3 className="text-lg font-semibold text-white mb-4">What's included</h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              {[
                'Effortlessly spider and map targets to uncover hidden security flaws',
                'Deliver high-quality, validated findings in hours, not weeks.',
                'Generate professional, enterprise-grade security reports automatically.',
              ].map((text) => (
                <li key={text} className="flex items-start gap-2.5 text-base text-white leading-relaxed">
                  <span className="shrink-0 mt-[3px]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 5" stroke="#187544" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Trustpilot */}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-white mb-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1l1.76 3.57 3.94.57-2.85 2.78.67 3.93L7 10.07l-3.52 1.78.67-3.93L1.3 5.14l3.94-.57L7 1z" fill="#00b579" />
              </svg>
              <span>Trustpilot</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-white">Rated 4.5/5.0</span>
              <span className="text-xs text-[#9e9e9e]">(100k+ reviews)</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-1/2 flex items-center justify-center py-8 px-6 max-lg:w-full max-lg:py-6 max-lg:px-4">
          <div className="w-full max-w-[440px] bg-white rounded-2xl px-9 pt-10 pb-8 shadow-xl max-sm:px-5 max-sm:pt-7 max-sm:pb-6">
            <h2 className="text-4xl font-bold text-[#342d2d] text-center tracking-tight m-0 mb-1 max-sm:text-[28px]">
              Log in
            </h2>
            <p className="text-base text-[#342d2d] text-center m-0 mb-7">
              Don't have an account?{' '}
              <Link to="/" className="text-[#0e9e9e] underline font-medium hover:underline">
                Sign up
              </Link>
            </p>

            {/* Demo hint */}
            <div className="mb-5 px-4 py-3 rounded-xl bg-[#f0fafa] border border-[#c3e9e9] text-sm text-[#342d2d]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <span className="font-semibold text-[#0e9e9e]">Demo account: </span>
              demo@aps.com / password123
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="mb-3">
                <FloatingInput
                  id="email"
                  name="email"
                  label="Email address"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              {/* Password */}
              <div className="mb-3">
                <FloatingInput
                  id="password"
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  error={error}
                  endAdornment={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="p-0 bg-transparent border-none cursor-pointer flex items-center"
                    >
                      <img src={showPassword ? openEye : closeEye} alt="" className="w-5 h-5 object-contain" />
                    </button>
                  }
                />
              </div>

              {/* Forgot password */}
              <div className="flex justify-end mb-5">
                <a href="#" className="text-sm text-[#0054eb] hover:underline">
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={!isFormFilled}
                className="w-full h-12 border-none rounded-[50px] bg-[#0e9e9e] text-white text-base font-semibold font-[Outfit,sans-serif] cursor-pointer tracking-wide transition-colors hover:bg-[#0c8a8a] disabled:opacity-55 disabled:cursor-not-allowed"
              >
                Log in
              </button>
            </form>

            {/* Social Login */}
            <div className="flex gap-3 mt-5">
              <button
                className="flex-1 h-11 rounded-[50px] border-none bg-black flex items-center justify-center cursor-pointer transition-opacity hover:opacity-85"
                aria-label="Log in with Apple"
              >
                <img src={appleLogo} alt="Apple" className="h-5 object-contain" />
              </button>
              <button
                className="flex-1 h-11 rounded-[50px] border border-[#dddddd] bg-[#f9f2ef] flex items-center justify-center cursor-pointer transition-opacity hover:opacity-85"
                aria-label="Log in with Google"
              >
                <img src={googleLogo} alt="Google" className="h-5 object-contain" />
              </button>
              <button
                className="flex-1 h-11 rounded-[50px] border-none bg-[#3d6ddf] flex items-center justify-center cursor-pointer transition-opacity hover:opacity-85"
                aria-label="Log in with Meta"
              >
                <img src={metaLogo} alt="Meta" className="h-5 object-contain" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
