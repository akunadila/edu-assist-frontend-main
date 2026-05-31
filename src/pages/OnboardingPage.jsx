import { useNavigate } from 'react-router-dom'
import { loginWithGoogle } from '../services/api'
//import '../styles/onboarding.css'

function OnboardingPage() {
  const navigate = useNavigate()

  function handleGoogleLogin() {
    loginWithGoogle()
  }

  return (
    <div className="min-h-screen bg-[#f0efed] flex items-center justify-center relative overflow-hidden font-[family-name:var(--font-geist)]">
      {/* Grid background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Card */}
      <div className="relative z-10 bg-white rounded-3xl px-8 py-8 sm:px-14 sm:py-15 w-full max-w-xl flex flex-col items-center gap-4 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
        {/* Logo */}
        <img
          src="/icons/logo-eduassist2.svg"
          alt="EduAssist"
          className="h-12 w-auto mb-2"
        />

        {/* Welcome Text */}
       <h1 className="text-2xl font-bold text-slate-700 tracking-tight">
  Selamat Datang di EduAssist
</h1>
        <p className="text-sm text-gray-500 text-center mb-3">
          Continue with Google to get started
        </p>

        {/* Google Login Button */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-full border border-gray-200 bg-white text-slate-900 font-semibold text-sm hover:bg-gray-50 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  )
}

export default OnboardingPage
