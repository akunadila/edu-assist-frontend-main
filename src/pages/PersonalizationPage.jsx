import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateStudentProfile } from '../services/api'

const STEPS = [
  {
    id: 'educationLevel',
    step: '1/4',
    title: 'What is your education level?',
    options: [
      { value: 'high_school', label: 'High School' },
      { value: 'undergraduate', label: 'Undergraduate' },
      { value: 'graduate', label: 'Graduate' },
    ],
  },
  {
    id: 'difficultyPreference',
    step: '2/4',
    title: 'How difficult should lessons be?',
    options: [
      { value: 'easy', label: 'Easy' },
      { value: 'medium', label: 'Medium' },
      { value: 'hard', label: 'Hard' },
      { value: 'adaptive', label: 'Adaptive' },
    ],
  },
  {
    id: 'pace',
    step: '3/4',
    title: "What's your learning pace?",
    options: [
      { value: 'slow', label: 'Slow' },
      { value: 'medium', label: 'Medium' },
      { value: 'fast', label: 'Fast' },
    ],
  },
  {
    id: 'explanationStyle',
    step: '4/4',
    title: 'How should EduAssist explain concepts?',
    options: [
      { value: 'concise', label: 'Concise'},
      { value: 'detailed', label: 'Detailed',},
      { value: 'step_by_step', label: 'Step by Step' },
      { value: 'analogy', label: 'Analogy' },
    ],
  },
]

function PersonalizationPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({
    educationLevel: '',
    difficultyPreference: '',
    pace: '',
    explanationStyle: '',
    favouriteSubjects: [],
  })

  const step = STEPS[currentStep]
  const isLastStep = currentStep === STEPS.length - 1
  const progress = ((currentStep) / STEPS.length) * 100

  function handleSelect(value) {
    setAnswers({ ...answers, [step.id]: value })
  }

  function canNext() {
    return answers[step.id] !== ''
  }

  function handleNext() {
    if (!canNext()) return
    if (isLastStep) {
      saveAndContinue()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  function handleBack() {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1)
  }

  // Ganti saveAndContinue()
async function saveAndContinue() {
  try {
    await updateStudentProfile({
      educationLevel: answers.educationLevel,
      difficultyPreference: answers.difficultyPreference,
      favouriteSubjects: answers.favouriteSubjects,
      pace: answers.pace,
      explanationStyle: answers.explanationStyle,
    })
    localStorage.setItem('hasPersonalized', 'true')
    navigate('/chat')
  } catch (err) {
    alert('Gagal menyimpan profil: ' + err.message)
  }
}

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col items-center justify-center relative overflow-hidden font-[family-name:var(--font-geist)]">
      {/* Grid background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-md w-full px-6 py-8 flex flex-col gap-5">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img src="/icons/image1.png" alt="EduAssist" style={{ height: '32px' }} />
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.07)] flex flex-col gap-5">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Step {step.step}</p>
          <h1 className="text-xl font-black text-slate-900 -tracking-tight leading-tight">{step.title}</h1>

          <div className="flex flex-col gap-2.5">
            {step.options.map((opt) => {
              const isSelected = answers[step.id] === opt.value
              return (
                <button
                  key={opt.value}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all w-full text-left cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 shadow-[0_0_0_3px_rgba(37,99,235,0.1)]'
                      : 'border-gray-200 bg-gray-50 hover:border-blue-600 hover:bg-blue-50'
                  }`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span className="text-xl flex-shrink-0">{opt.emoji}</span>
                  <span className="flex-1 text-sm font-medium text-slate-900">{opt.label}</span>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-transparent border-gray-200 text-slate-900'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex gap-3 justify-end mt-2">
            {currentStep > 0 && (
              <button
                className="px-5 py-2 rounded-lg border border-gray-200 bg-white text-gray-500 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-50"
                onClick={handleBack}
              >
                ← Back
              </button>
            )}
            <button
              className={`px-6 py-2 rounded-lg text-sm font-semibold flex-1 transition-all ${
                canNext()
                  ? 'bg-blue-600 text-white cursor-pointer shadow-lg hover:opacity-92 hover:-translate-y-1'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              onClick={handleNext}
              disabled={!canNext()}
            >
              {isLastStep ? 'Finish' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonalizationPage