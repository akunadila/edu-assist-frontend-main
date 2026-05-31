import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/personalization.css'

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
    <div className="personal-root">
      <div className="personal-grid" />
      <div className="personal-container">

        {/* Logo */}
        <div className="personal-logo-wrap">
          <img src="/icons/image1.png" alt="EduAssist" style={{ height: '32px' }} />
        </div>

        {/* Progress bar */}
        <div className="personal-progress-bar">
          <div className="personal-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Card */}
        <div className="personal-card">
          <p className="personal-step-label">Step {step.step}</p>
          <h1 className="personal-title">{step.title}</h1>

          <div className="personal-options">
            {step.options.map((opt) => (
              <button
                key={opt.value}
                className={`personal-option-row ${answers[step.id] === opt.value ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                <span className="option-row-emoji">{opt.emoji}</span>
                <span className="option-row-label">{opt.label}</span>
                <span className="option-row-check">
                  {answers[step.id] === opt.value ? '✓' : ''}
                </span>
              </button>
            ))}
          </div>

          <div className="personal-actions">
            {currentStep > 0 && (
              <button className="personal-back-btn" onClick={handleBack}>← Back</button>
            )}
            <button
              className={`personal-next-btn ${canNext() ? 'active' : ''}`}
              onClick={handleNext}
              disabled={!canNext()}
            >
              {isLastStep ? 'Finish ' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonalizationPage