import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import '../styles/onboarding.css'

const LEVEL_PENDIDIKAN = ['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2/S3', 'Other']
const PREFERENSI_TONE = ['Formal', 'Santai', 'Singkat & Padat', 'Detail & Lengkap']

function OnboardingPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nama: '',
    usia: '',
    levelPendidikan: 'S1',
    preferensiTone: 'Santai',
  })
  const [customLevel, setCustomLevel] = useState('')
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  function handleSelect(field, value) {
    setForm({ ...form, [field]: value })
    setErrors({ ...errors, [field]: '' })
    if (field === 'levelPendidikan' && value !== 'Other') {
      setCustomLevel('')
    }
  }

  function validate() {
    const newErrors = {}
    if (!form.nama.trim()) newErrors.nama = 'Nama tidak boleh kosong'
    if (!form.usia || isNaN(form.usia) || Number(form.usia) < 5 || Number(form.usia) > 100)
      newErrors.usia = 'Masukkan usia yang valid'
    if (!form.levelPendidikan || (form.levelPendidikan === 'Other' && !customLevel.trim()))
      newErrors.levelPendidikan = 'Isi level pendidikanmu'
    if (!form.preferensiTone) newErrors.preferensiTone = 'Pilih preferensi tone'
    return newErrors
  }

  function handleSubmit() {
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    localStorage.setItem('userProfile', JSON.stringify(form))
    navigate('/chat')
  }

  return (
    <div className="onboarding-root">
      <div className="onboarding-bg" />
      <div className="onboarding-grid" />

      <div className="onboarding-container">
      
        <div className="onboarding-brand">
          <div className="brand-badge">Coding Camp 2026 · DBS Foundation</div>
          <h1 className="brand-title">
            Edu<span className="brand-accent">Assist</span>
          </h1>
          <p className="brand-desc">
            Asisten akademik adaptif yang memahami siapa kamu — bukan sekadar menjawab pertanyaan.
          </p>
          <div className="brand-features">
            {[
              
            ].map((f) => (
              <div className="feature-item" key={f}>
                <span className="feature-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="onboarding-card">
          <div className="card-header">
            <h2 className="card-title">Hello there!</h2>
            <p className="card-subtitle">
              Isi profilmu agar kami bisa menyesuaikan pengalaman belajarmu
            </p>
          </div>

          <div className="form-fields">
            
            <div className="field-group">
              <Label className="field-label">Nama</Label>
              <Input
                name="nama"
                placeholder="Nama lengkapmu"
                value={form.nama}
                onChange={handleChange}
                className="field-input"
              />
              {errors.nama && <p className="field-error">{errors.nama}</p>}
            </div>

          
            <div className="field-group">
              <Label className="field-label">Usia</Label>
              <Input
                name="usia"
                type="number"
                placeholder="Contoh: 20"
                value={form.usia}
                onChange={handleChange}
                className="field-input"
              />
              {errors.usia && <p className="field-error">{errors.usia}</p>}
            </div>

            {}
            <div className="field-group">
              <Label className="field-label">Level Pendidikan</Label>
              <Select
                value={form.levelPendidikan}
                onValueChange={(v) => handleSelect('levelPendidikan', v)}
              >
                <SelectTrigger className="field-input">
                  <SelectValue placeholder="Pilih level pendidikan" />
                </SelectTrigger>
                <SelectContent className="select-content">
                  {LEVEL_PENDIDIKAN.map((lvl) => (
                    <SelectItem key={lvl} value={lvl} className="select-item">
                      {lvl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.levelPendidikan === 'Other' && (
                <Input
                  placeholder="Tulis level pendidikanmu"
                  value={customLevel}
                  onChange={(e) => {
                    setCustomLevel(e.target.value)
                    setForm({ ...form, levelPendidikan: e.target.value })
                    setErrors({ ...errors, levelPendidikan: '' })
                  }}
                  className="field-input"
                  style={{ marginTop: '0.5rem' }}
                />
              )}
              {errors.levelPendidikan && <p className="field-error">{errors.levelPendidikan}</p>}
            </div>

            <div className="field-group">
              <Label className="field-label">Preferensi Tone Respons</Label>
              <Select
                value={form.preferensiTone}
                onValueChange={(v) => handleSelect('preferensiTone', v)}
              >
                <SelectTrigger className="field-input">
                  <SelectValue placeholder="Pilih gaya komunikasi" />
                </SelectTrigger>
                <SelectContent className="select-content">
                  {PREFERENSI_TONE.map((tone) => (
                    <SelectItem key={tone} value={tone} className="select-item">
                      {tone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.preferensiTone && <p className="field-error">{errors.preferensiTone}</p>}
            </div>
          </div>

          <button className="submit-btn" onClick={handleSubmit}>
            Mulai Belajar
            <span className="submit-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage