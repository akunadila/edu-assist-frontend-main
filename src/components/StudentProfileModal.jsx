/* import { useState, useEffect } from 'react'
import '../styles/StudentProfileModal.css'

export default function StudentProfileModal({
  open,
  onSave,
  isEditing = false,
}) {
  const [step, setStep] = useState(1)

  const [profile, setProfile] = useState({
    educationLevel: 'undergraduate',
    difficultyPreference: 'adaptive',
    pace: 'medium',
    explanationStyle: 'detailed',
    favouriteSubjects: [],
  })

  useEffect(() => {
    const saved = localStorage.getItem('studentProfile')

    if (saved) {
      setProfile(JSON.parse(saved))
    }
  }, [])

  const handleChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = () => {
    onSave(profile)
  }

  if (!open) return null

  // ==========================
  // EDIT MODE
  // ==========================

  if (isEditing) {
    return (
      <div className="profile-modal-overlay">
        <div className="edit-profile-modal">
          <h2>Learning Preferences</h2>

          <label>Education Level</label>
          <select
            value={profile.educationLevel}
            onChange={(e) =>
              handleChange('educationLevel', e.target.value)
            }
          >
            <option value="high_school">High School</option>
            <option value="undergraduate">Undergraduate</option>
            <option value="graduate">Graduate</option>
          </select>

          <label>Difficulty Preference</label>
          <select
            value={profile.difficultyPreference}
            onChange={(e) =>
              handleChange(
                'difficultyPreference',
                e.target.value
              )
            }
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="adaptive">Adaptive</option>
          </select>

          <label>Learning Pace</label>
          <select
            value={profile.pace}
            onChange={(e) =>
              handleChange('pace', e.target.value)
            }
          >
            <option value="slow">Slow</option>
            <option value="medium">Medium</option>
            <option value="fast">Fast</option>
          </select>

          <label>Explanation Style</label>
          <select
            value={profile.explanationStyle}
            onChange={(e) =>
              handleChange(
                'explanationStyle',
                e.target.value
              )
            }
          >
            <option value="concise">Concise</option>
            <option value="detailed">Detailed</option>
            <option value="step_by_step">
              Step by Step
            </option>
            <option value="analogy">Analogy</option>
          </select>

          <button
            className="finish-btn"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    )
  }

  // ==========================
  // ONBOARDING MODE
  // ==========================

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${(step / 4) * 100}%`,
            }}
          />
        </div>

        {step === 1 && (
          <>
            <h2>What is your education level?</h2>

            <button
              className={`option-btn ${
                profile.educationLevel ===
                'high_school'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                handleChange(
                  'educationLevel',
                  'high_school'
                )
              }
            >
              🎒 High School
            </button>

            <button
              className={`option-btn ${
                profile.educationLevel ===
                'undergraduate'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                handleChange(
                  'educationLevel',
                  'undergraduate'
                )
              }
            >
              🎓 Undergraduate
            </button>

            <button
              className={`option-btn ${
                profile.educationLevel ===
                'graduate'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                handleChange(
                  'educationLevel',
                  'graduate'
                )
              }
            >
              📚 Graduate
            </button>

            <button
              className="continue-btn"
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2>
              How difficult should lessons be?
            </h2>

            {[
              'easy',
              'medium',
              'hard',
              'adaptive',
            ].map((item) => (
              <button
                key={item}
                className={`option-btn ${
                  profile.difficultyPreference ===
                  item
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  handleChange(
                    'difficultyPreference',
                    item
                  )
                }
              >
                {item}
              </button>
            ))}

            <button
              className="continue-btn"
              onClick={() => setStep(3)}
            >
              Continue
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2>What's your learning pace?</h2>

            {['slow', 'medium', 'fast'].map(
              (item) => (
                <button
                  key={item}
                  className={`option-btn ${
                    profile.pace === item
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    handleChange('pace', item)
                  }
                >
                  {item}
                </button>
              )
            )}

            <button
              className="continue-btn"
              onClick={() => setStep(4)}
            >
              Continue
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <h2>
              How should EduAssist explain
              concepts?
            </h2>

            {[
              'concise',
              'detailed',
              'step_by_step',
              'analogy',
            ].map((item) => (
              <button
                key={item}
                className={`option-btn ${
                  profile.explanationStyle ===
                  item
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  handleChange(
                    'explanationStyle',
                    item
                  )
                }
              >
                {item.replaceAll('_', ' ')}
              </button>
            ))}

            <button
              className="finish-btn"
              onClick={handleSave}
            >
              Finish
            </button>
          </>
        )}
      </div>
    </div>
  )
} */