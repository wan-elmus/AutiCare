'use client'
import { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { UserContext } from '@/context/UserContext'
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa'

export default function Profile() {
  const { isDark } = useTheme()
  const { user } = useContext(UserContext)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('caregiver')
  const [caregiver, setCaregiver] = useState(null)
  const [children, setChildren] = useState([])
  const [dosages, setDosages] = useState([])
  const [caregiverForm, setCaregiverForm] = useState({ name: '', email: '', phone: '', relation_type: '' })
  const [childForm, setChildForm] = useState({
    name: '', age: '', gender: '', conditions: '', allergies: '', milestones: '',
    behavioral_notes: '', emergency_contacts: '', medical_history: ''
  })
  const [dosageForm, setDosageForm] = useState({
    child_id: '', medication: '', condition: '', start_date: '', dosage: '',
    frequency: '', intervals: [], status: 'active', notes: ''
  })
  const [editingChildId, setEditingChildId] = useState(null)
  const [editingDosageId, setEditingDosageId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    console.log('UserContext user:', user)
    if (!user) {
      router.push('/auth/login')
      return
    }
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchCaregiver(), fetchChildren(), fetchDosages()])
      setLoading(false)
    }
    loadData()
  }, [user])

  const fetchCaregiver = async () => {
    try {
      const res = await fetch(`${API_URL}/caregivers/me`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setCaregiver(data)
        setCaregiverForm({ name: data.name, email: data.email, phone: data.phone || '', relation_type: data.relation_type || '' })
      } else {
        setError('Failed to fetch caregiver data')
      }
    } catch (err) {
      setError('Error fetching caregiver data')
    }
  }

  const fetchChildren = async () => {
    try {
      const res = await fetch(`${API_URL}/children`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setChildren(data)
      } else {
        setError('Failed to fetch children data')
      }
    } catch (err) {
      setError('Error fetching children data')
    }
  }

  const fetchDosages = async () => {
    try {
      const res = await fetch(`${API_URL}/dosages`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setDosages(data)
      } else {
        setError('Failed to fetch dosages')
      }
    } catch (err) {
      setError('Error fetching dosages')
    }
  }

  const handleCaregiverSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/caregivers/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(caregiverForm),
      })
      if (res.ok) {
        setCaregiver(await res.json())
        setError('')
      } else {
        setError('Failed to update caregiver')
      }
    } catch (err) {
      setError('Error updating caregiver')
    }
  }

  const handleChildSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editingChildId ? 'PUT' : 'POST'
      const url = editingChildId ? `${API_URL}/children/${editingChildId}` : `${API_URL}/children`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(childForm),
      })
      if (res.ok) {
        await fetchChildren()
        setChildForm({
          name: '', age: '', gender: '', conditions: '', allergies: '', milestones: '',
          behavioral_notes: '', emergency_contacts: '', medical_history: ''
        })
        setEditingChildId(null)
        setError('')
      } else {
        setError('Failed to save child')
      }
    } catch (err) {
      setError('Error saving child')
    }
  }

  const handleDosageSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editingDosageId ? 'PUT' : 'POST'
      const url = editingDosageId ? `${API_URL}/dosages/${editingDosageId}` : `${API_URL}/dosages`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(dosageForm),
      })
      if (res.ok) {
        await fetchDosages()
        setDosageForm({
          child_id: '', medication: '', condition: '', start_date: '', dosage: '',
          frequency: '', intervals: [], status: 'active', notes: ''
        })
        setEditingDosageId(null)
        setError('')
      } else {
        setError('Failed to save dosage')
      }
    } catch (err) {
      setError('Error saving dosage')
    }
  }

  const handleChildEdit = (child) => {
    setChildForm(child)
    setEditingChildId(child.id)
  }

  const handleDosageEdit = (dosage) => {
    setDosageForm({ ...dosage, intervals: dosage.intervals || [] })
    setEditingDosageId(dosage.id)
  }

  const handleChildDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/children/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        await fetchChildren()
      } else {
        setError('Failed to delete child')
      }
    } catch (err) {
      setError('Error deleting child')
    }
  }

  const handleDosageDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/dosages/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        await fetchDosages()
      } else {
        setError('Failed to delete dosage')
      }
    } catch (err) {
      setError('Error deleting dosage')
    }
  }

  const tabs = [
    { id: 'caregiver', label: 'Caregiver' },
    { id: 'child', label: 'Child' },
    { id: 'dosage', label: 'Dosage' },
  ]

  if (loading) return <div className={`p-6 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>Loading...</div>

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gradient-to-br from-gray-900 via-teal-950 to-gray-800' : 'bg-gradient-to-br from-teal-50 via-blue-50 to-teal-100'}`}>
      <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
        Caregiver & Child Profile
      </h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Tabs */}
      <div className="flex border-b border-teal-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium ${activeTab === tab.id ? (isDark ? 'text-teal-400 border-b-2 border-teal-400' : 'text-teal-600 border-b-2 border-teal-600') : isDark ? 'text-gray-400' : 'text-gray-600'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Caregiver Tab */}
      <AnimatePresence>
        {activeTab === 'caregiver' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-md`}
          >
            <h2 className={`text-2xl font-semibold mb-4 ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
              Caregiver Profile
            </h2>
            {caregiver ? (
              <form onSubmit={handleCaregiverSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={caregiverForm.name}
                    onChange={(e) => setCaregiverForm({ ...caregiverForm, name: e.target.value })}
                    required
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={caregiverForm.email}
                    onChange={(e) => setCaregiverForm({ ...caregiverForm, email: e.target.value })}
                    required
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={caregiverForm.phone}
                    onChange={(e) => setCaregiverForm({ ...caregiverForm, phone: e.target.value })}
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Relation to Child
                  </label>
                  <input
                    type="text"
                    value={caregiverForm.relation_type}
                    onChange={(e) => setCaregiverForm({ ...caregiverForm, relation_type: e.target.value })}
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-teal-600 text-teal-100 hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'}`}
                >
                  Save
                </motion.button>
              </form>
            ) : (
              <p className={`text-sm ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                Loading caregiver data...
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Child Tab */}
      <AnimatePresence>
        {activeTab === 'child' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-md`}
          >
            <h2 className={`text-2xl font-semibold mb-4 ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
              Child Profile
            </h2>
            <form onSubmit={handleChildSubmit} className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={childForm.name}
                    onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                    required
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Age
                  </label>
                  <input
                    type="number"
                    value={childForm.age}
                    onChange={(e) => setChildForm({ ...childForm, age: e.target.value })}
                    required
                    min="0"
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Gender
                  </label>
                  <select
                    value={childForm.gender}
                    onChange={(e) => setChildForm({ ...childForm, gender: e.target.value })}
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Conditions
                  </label>
                  <textarea
                    value={childForm.conditions}
                    onChange={(e) => setChildForm({ ...childForm, conditions: e.target.value })}
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                    rows={3}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Allergies
                  </label>
                  <textarea
                    value={childForm.allergies}
                    onChange={(e) => setChildForm({ ...childForm, allergies: e.target.value })}
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                    rows={3}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Milestones
                  </label>
                  <textarea
                    value={childForm.milestones}
                    onChange={(e) => setChildForm({ ...childForm, milestones: e.target.value })}
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                    rows={3}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Behavioral Notes
                  </label>
                  <textarea
                    value={childForm.behavioral_notes}
                    onChange={(e) => setChildForm({ ...childForm, behavioral_notes: e.target.value })}
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                    rows={3}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Emergency Contacts
                  </label>
                  <textarea
                    value={childForm.emergency_contacts}
                    onChange={(e) => setChildForm({ ...childForm, emergency_contacts: e.target.value })}
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                    rows={3}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Medical History
                  </label>
                  <textarea
                    value={childForm.medical_history}
                    onChange={(e) => setChildForm({ ...childForm, medical_history: e.target.value })}
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                    rows={3}
                  />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-teal-600 text-teal-100 hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'}`}
              >
                {editingChildId ? 'Update' : 'Add'} Child
              </motion.button>
              {editingChildId && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    setChildForm({
                      name: '', age: '', gender: '', conditions: '', allergies: '', milestones: '',
                      behavioral_notes: '', emergency_contacts: '', medical_history: ''
                    })
                    setEditingChildId(null)
                  }}
                  className={`ml-2 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-600 text-teal-200 hover:bg-gray-500' : 'bg-teal-200 text-teal-800 hover:bg-teal-300'}`}
                >
                  Cancel
                </motion.button>
              )}
            </form>
            <div className="space-y-4">
              {children.map((child) => (
                <div
                  key={child.id}
                  className={`p-4 rounded-lg shadow-md ${isDark ? 'bg-gray-700' : 'bg-teal-50'}`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                      {child.name} (Age: {child.age})
                    </h3>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleChildEdit(child)}
                        className={`p-2 rounded-full ${isDark ? 'bg-teal-600 text-teal-100' : 'bg-teal-500 text-white'}`}
                      >
                        <FaEdit />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleChildDelete(child.id)}
                        className="p-2 rounded-full bg-red-500 text-white"
                      >
                        <FaTrash />
                      </motion.button>
                    </div>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                    Gender: {child.gender || 'N/A'}<br />
                    Conditions: {child.conditions || 'N/A'}<br />
                    Allergies: {child.allergies || 'N/A'}<br />
                    Milestones: {child.milestones || 'N/A'}<br />
                    Behavioral Notes: {child.behavioral_notes || 'N/A'}<br />
                    Emergency Contacts: {child.emergency_contacts || 'N/A'}<br />
                    Medical History: {child.medical_history || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dosage Tab */}
      <AnimatePresence>
        {activeTab === 'dosage' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-md`}
          >
            <h2 className={`text-2xl font-semibold mb-4 ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
              Dosage Tracking
            </h2>
            <form onSubmit={handleDosageSubmit} className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Child
                  </label>
                  <select
                    value={dosageForm.child_id}
                    onChange={(e) => setDosageForm({ ...dosageForm, child_id: e.target.value })}
                    required
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                  >
                    <option value="">Select Child</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>{child.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Medication
                  </label>
                  <input
                    type="text"
                    value={dosageForm.medication}
                    onChange={(e) => setDosageForm({ ...dosageForm, medication: e.target.value })}
                    required
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Condition
                  </label>
                  <input
                    type="text"
                    value={dosageForm.condition}
                    onChange={(e) => setDosageForm({ ...dosageForm, condition: e.target.value })}
                    required
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dosageForm.start_date}
                    onChange={(e) => setDosageForm({ ...dosageForm, start_date: e.target.value })}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={dosageForm.dosage}
                    onChange={(e) => setDosageForm({ ...dosageForm, dosage: e.target.value })}
                    required
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Frequency
                  </label>
                  <select
                    value={dosageForm.frequency}
                    onChange={(e) => setDosageForm({ ...dosageForm, frequency: e.target.value, intervals: [] })}
                    required
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                  >
                    <option value="">Select</option>
                    <option value="daily">Daily</option>
                    <option value="every_x_hours">Every X Hours</option>
                    <option value="specific_days">Specific Days</option>
                  </select>
                </div>
                {dosageForm.frequency === 'daily' && (
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                      Time
                    </label>
                    <input
                      type="time"
                      value={dosageForm.intervals[0] || ''}
                      onChange={(e) => setDosageForm({ ...dosageForm, intervals: [e.target.value] })}
                      className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                    />
                  </div>
                )}
                {dosageForm.frequency === 'specific_days' && (
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                      Days
                    </label>
                    <input
                      type="time"
                      value={dosageForm.intervals[0] || ''}
                      onChange={(e) => {
                        const newIntervals = [...dosageForm.intervals]
                        newIntervals[0] = e.target.value
                        setDosageForm({ ...dosageForm, intervals: newIntervals })
                      }}
                      className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                    />
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <label key={day} className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          checked={dosageForm.intervals.includes(day)}
                          onChange={(e) => {
                            const newIntervals = e.target.checked
                              ? [...dosageForm.intervals, day]
                              : dosageForm.intervals.filter((d) => d !== day)
                            setDosageForm({ ...dosageForm, intervals: newIntervals })
                          }}
                          className="mr-2"
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                )}
                {dosageForm.frequency === 'every_x_hours' && (
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                      Hours
                    </label>
                    <input
                      type="number"
                      value={dosageForm.intervals[0] || ''}
                      onChange={(e) => setDosageForm({ ...dosageForm, intervals: [e.target.value] })}
                      min="1"
                      className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                    />
                  </div>
                )}
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Status
                  </label>
                  <select
                    value={dosageForm.status}
                    onChange={(e) => setDosageForm({ ...dosageForm, status: e.target.value })}
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                    Notes
                  </label>
                  <textarea
                    value={dosageForm.notes}
                    onChange={(e) => setDosageForm({ ...dosageForm, notes: e.target.value })}
                    className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}
                    rows={3}
                  />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-teal-600 text-teal-100 hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'}`}
              >
                {editingDosageId ? 'Update' : 'Add'} Dosage
              </motion.button>
              {editingDosageId && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    setDosageForm({
                      child_id: '', medication: '', condition: '', start_date: '', dosage: '',
                      frequency: '', intervals: [], status: 'active', notes: ''
                    })
                    setEditingDosageId(null)
                  }}
                  className={`ml-2 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-600 text-teal-200 hover:bg-gray-500' : 'bg-teal-200 text-teal-800 hover:bg-teal-300'}`}
                >
                  Cancel
                </motion.button>
              )}
            </form>
            <div className="overflow-x-auto">
              <table className={`w-full text-sm ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-600' : 'border-teal-200'}`}>
                    <th className="p-2 text-left">Child</th>
                    <th className="p-2 text-left">Medication</th>
                    <th className="p-2 text-left">Condition</th>
                    <th className="p-2 text-left">Start Date</th>
                    <th className="p-2 text-left">Dosage</th>
                    <th className="p-2 text-left">Frequency</th>
                    <th className="p-2 text-left">Intervals</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Notes</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dosages.map((dosage) => (
                    <tr key={dosage.id} className={`border-b ${isDark ? 'border-gray-600' : 'border-teal-200'}`}>
                      <td className="p-2">{children.find(c => c.id === dosage.child_id)?.name || 'N/A'}</td>
                      <td className="p-2">{dosage.medication}</td>
                      <td className="p-2">{dosage.condition}</td>
                      <td className="p-2">{dosage.start_date}</td>
                      <td className="p-2">{dosage.dosage}</td>
                      <td className="p-2">{dosage.frequency}</td>
                      <td className="p-2">{dosage.intervals?.join(', ') || 'N/A'}</td>
                      <td className="p-2">{dosage.status}</td>
                      <td className="p-2">{dosage.notes || 'N/A'}</td>
                      <td className="p-2 flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDosageEdit(dosage)}
                          className={`p-2 rounded-full ${isDark ? 'bg-teal-600 text-teal-100' : 'bg-teal-500 text-white'}`}
                        >
                          <FaEdit />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDosageDelete(dosage.id)}
                          className="p-2 rounded-full bg-red-500 text-white"
                        >
                          <FaTrash />
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}