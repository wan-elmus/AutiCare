'use client'
import { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { UserContext } from '@/context/UserContext'
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes } from 'react-icons/fa'

export default function Profile() {
  const { isDark } = useTheme()
  const { user } = useContext(UserContext)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('caregiver')
  const [caregiver, setCaregiver] = useState(null)
  const [children, setChildren] = useState([])
  const [dosages, setDosages] = useState([])
  const [caregiverForm, setCaregiverForm] = useState({ first_name: '', last_name: '', email: '', phone: '', relation_type: '' })
  const [childForm, setChildForm] = useState({
    name: '', age: '', gender: '', conditions: '', allergies: '', milestones: '',
    behavioral_notes: '', emergency_contacts: '', medical_history: ''
  })
  const [dosageForm, setDosageForm] = useState({
    child_id: '', medication: '', condition: '', start_date: '', dosage: '',
    frequency: 'daily', intervals: [], status: 'active', notes: ''
  })
  const [editingChildId, setEditingChildId] = useState(null)
  const [editingDosageId, setEditingDosageId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://195.7.7.15:8002'

  useEffect(() => {
    console.log('Profile: UserContext user:', user)
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
  }, [user, router])

  const fetchCaregiver = async () => {
    try {
      const res = await fetch(`${API_URL}/caregivers/me?email=${encodeURIComponent(user.email)}`, {
        method: 'GET',
      })
      if (res.ok) {
        const data = await res.json()
        setCaregiver(data)
        setCaregiverForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email,
          phone: data.phone || '',
          relation_type: data.relation_type || ''
        })
        setError('')
      } else if (res.status === 404) {
        setCaregiver(null)
        setError('Caregiver profile not found. Please update your profile.')
      } else {
        throw new Error(`Failed to fetch caregiver: ${res.status}`)
      }
    } catch (err) {
      setError('Error fetching caregiver data')
      console.error('Profile: fetchCaregiver error:', err)
    }
  }

  const fetchChildren = async () => {
    try {
      const res = await fetch(`${API_URL}/children?email=${encodeURIComponent(user.email)}`, {
        method: 'GET',
      })
      if (res.ok) {
        const data = await res.json()
        setChildren(data)
        setError('')
      } else if (res.status === 404) {
        setChildren([])
        setError('No children found. Add a child profile.')
      } else {
        throw new Error(`Failed to fetch children: ${res.status}`)
      }
    } catch (err) {
      setError('Error fetching children data')
      console.error('Profile: fetchChildren error:', err)
    }
  }

  const fetchDosages = async () => {
    try {
      const res = await fetch(`${API_URL}/dosages?email=${encodeURIComponent(user.email)}`, {
        method: 'GET',
      })
      if (res.ok) {
        const data = await res.json()
        setDosages(data)
        setError('')
      } else if (res.status === 404) {
        setDosages([])
        setError('No dosages found. Add a child profile first.')
      } else {
        throw new Error(`Failed to fetch dosages: ${res.status}`)
      }
    } catch (err) {
      setError('Error fetching dosages')
      console.error('Profile: fetchDosages error:', err)
    }
  }

  const handleCaregiverSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/caregivers/me?email=${encodeURIComponent(user.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caregiverForm),
      })
      if (res.ok) {
        const updatedCaregiver = await res.json()
        setCaregiver(updatedCaregiver)
        setError('')
        console.log('Profile: Caregiver updated:', updatedCaregiver)
      } else {
        throw new Error(`Failed to update caregiver: ${res.status}`)
      }
    } catch (err) {
      setError('Error updating caregiver profile')
      console.error('Profile: handleCaregiverSubmit error:', err)
    }
  }

  const handleChildSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editingChildId ? 'PUT' : 'POST'
      const url = editingChildId
        ? `${API_URL}/children/${editingChildId}?email=${encodeURIComponent(user.email)}`
        : `${API_URL}/children?email=${encodeURIComponent(user.email)}`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
        console.log('Profile: Child saved:', childForm)
      } else {
        throw new Error(`Failed to save child: ${res.status}`)
      }
    } catch (err) {
      setError('Error saving child profile')
      console.error('Profile: handleChildSubmit error:', err)
    }
  }

  const handleDosageSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editingDosageId ? 'PUT' : 'POST'
      const url = editingDosageId
        ? `${API_URL}/dosages/${editingDosageId}?email=${encodeURIComponent(user.email)}`
        : `${API_URL}/dosages?email=${encodeURIComponent(user.email)}`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dosageForm,
          intervals: dosageForm.intervals.length ? dosageForm.intervals : ['00:00'],
        }),
      })
      if (res.ok) {
        await fetchDosages()
        setDosageForm({
          child_id: '', medication: '', condition: '', start_date: '', dosage: '',
          frequency: 'daily', intervals: [], status: 'active', notes: ''
        })
        setEditingDosageId(null)
        setError('')
        console.log('Profile: Dosage saved:', dosageForm)
      } else {
        throw new Error(`Failed to save dosage: ${res.status}`)
      }
    } catch (err) {
      setError('Error saving dosage')
      console.error('Profile: handleDosageSubmit error:', err)
    }
  }

  const handleDeleteChild = async (id) => {
    try {
      const res = await fetch(`${API_URL}/children/${id}?email=${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setChildren(children.filter((child) => child.id !== id))
        setError('')
        console.log('Profile: Child deleted:', id)
      } else {
        throw new Error(`Failed to delete child: ${res.status}`)
      }
    } catch (err) {
      setError('Error deleting child')
      console.error('Profile: handleDeleteChild error:', err)
    }
  }

  const handleDeleteDosage = async (id) => {
    try {
      const res = await fetch(`${API_URL}/dosages/${id}?email=${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDosages(dosages.filter((dosage) => dosage.id !== id))
        setError('')
        console.log('Profile: Dosage deleted:', id)
      } else {
        throw new Error(`Failed to delete dosage: ${res.status}`)
      }
    } catch (err) {
      setError('Error deleting dosage')
      console.error('Profile: handleDeleteDosage error:', err)
    }
  }

  const editChild = (child) => {
    setChildForm(child)
    setEditingChildId(child.id)
  }

  const editDosage = (dosage) => {
    setDosageForm(dosage)
    setEditingDosageId(dosage.id)
  }

  const cancelEdit = () => {
    setChildForm({
      name: '', age: '', gender: '', conditions: '', allergies: '', milestones: '',
      behavioral_notes: '', emergency_contacts: '', medical_history: ''
    })
    setDosageForm({
      child_id: '', medication: '', condition: '', start_date: '', dosage: '',
      frequency: 'daily', intervals: [], status: 'active', notes: ''
    })
    setEditingChildId(null)
    setEditingDosageId(null)
    setError('')
  }

  const tabs = [
    { id: 'caregiver', label: 'Caregiver Profile' },
    { id: 'children', label: 'Children' },
    { id: 'dosages', label: 'Dosages' },
  ]

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <p className={`${isDark ? 'text-teal-400' : 'text-teal-600'}`}>Loading...</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>Profile</h1>
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-semibold ${
              activeTab === tab.id
                ? isDark
                  ? 'border-b-2 border-teal-400 text-teal-400'
                  : 'border-b-2 border-teal-600 text-teal-600'
                : isDark
                  ? 'text-gray-400'
                  : 'text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <p className={`text-red-500 mb-4 text-sm`}>{error}</p>
      )}

      {/* Caregiver Tab */}
      <AnimatePresence>
        {activeTab === 'caregiver' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <form onSubmit={handleCaregiverSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">First Name</label>
                <input
                  type="text"
                  value={caregiverForm.first_name}
                  onChange={(e) => setCaregiverForm({ ...caregiverForm, first_name: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Last Name</label>
                <input
                  type="text"
                  value={caregiverForm.last_name}
                  onChange={(e) => setCaregiverForm({ ...caregiverForm, last_name: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={caregiverForm.email}
                  disabled
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-gray-200 border-gray-300 text-gray-600'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Phone</label>
                <input
                  type="text"
                  value={caregiverForm.phone}
                  onChange={(e) => setCaregiverForm({ ...caregiverForm, phone: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Relation Type</label>
                <input
                  type="text"
                  value={caregiverForm.relation_type}
                  onChange={(e) => setCaregiverForm({ ...caregiverForm, relation_type: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                  isDark ? 'bg-teal-600 text-teal-100 hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
              >
                <FaSave /> Save Profile
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children Tab */}
      <AnimatePresence>
        {activeTab === 'children' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <form onSubmit={handleChildSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={childForm.name}
                  onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Age</label>
                <input
                  type="number"
                  value={childForm.age}
                  onChange={(e) => setChildForm({ ...childForm, age: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Gender</label>
                <select
                  value={childForm.gender}
                  onChange={(e) => setChildForm({ ...childForm, gender: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Conditions</label>
                <textarea
                  value={childForm.conditions}
                  onChange={(e) => setChildForm({ ...childForm, conditions: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Allergies</label>
                <textarea
                  value={childForm.allergies}
                  onChange={(e) => setChildForm({ ...childForm, allergies: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                    isDark ? 'bg-teal-600 text-teal-100 hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'
                  }`}
                >
                  <FaSave /> {editingChildId ? 'Update Child' : 'Add Child'}
                </motion.button>
                {editingChildId && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={cancelEdit}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                      isDark ? 'bg-gray-600 text-gray-100 hover:bg-gray-700' : 'bg-gray-400 text-white hover:bg-gray-500'
                    }`}
                  >
                    <FaTimes /> Cancel
                  </motion.button>
                )}
              </div>
            </form>

            <div className="space-y-4">
              {children.map((child) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">{child.name}</h3>
                      <p className="text-sm">Age: {child.age || 'N/A'}</p>
                      <p className="text-sm">Gender: {child.gender || 'N/A'}</p>
                      <p className="text-sm">Conditions: {child.conditions || 'None'}</p>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => editChild(child)}
                        className={`p-2 rounded-full ${
                          isDark ? 'bg-teal-600 text-teal-100' : 'bg-teal-500 text-white'
                        }`}
                      >
                        <FaEdit />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteChild(child.id)}
                        className={`p-2 rounded-full ${
                          isDark ? 'bg-red-600 text-red-100' : 'bg-red-500 text-white'
                        }`}
                      >
                        <FaTrash />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dosages Tab */}
      <AnimatePresence>
        {activeTab === 'dosages' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <form onSubmit={handleDosageSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Child</label>
                <select
                  value={dosageForm.child_id}
                  onChange={(e) => setDosageForm({ ...dosageForm, child_id: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                >
                  <option value="">Select Child</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Medication</label>
                <input
                  type="text"
                  value={dosageForm.medication}
                  onChange={(e) => setDosageForm({ ...dosageForm, medication: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Condition</label>
                <input
                  type="text"
                  value={dosageForm.condition}
                  onChange={(e) => setDosageForm({ ...dosageForm, condition: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={dosageForm.start_date}
                  onChange={(e) => setDosageForm({ ...dosageForm, start_date: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Dosage</label>
                <input
                  type="text"
                  value={dosageForm.dosage}
                  onChange={(e) => setDosageForm({ ...dosageForm, dosage: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Frequency</label>
                <select
                  value={dosageForm.frequency}
                  onChange={(e) => setDosageForm({ ...dosageForm, frequency: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="daily">Daily</option>
                  <option value="specific_days">Specific Days</option>
                  <option value="every_x_hours">Every X Hours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Intervals (e.g., 08:00, or hours for every_x_hours)</label>
                <input
                  type="text"
                  value={dosageForm.intervals.join(',')}
                  onChange={(e) => setDosageForm({ ...dosageForm, intervals: e.target.value.split(',').map((i) => i.trim()) })}
                  placeholder="e.g., 08:00, 20:00 or 4 for every 4 hours"
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  value={dosageForm.status}
                  onChange={(e) => setDosageForm({ ...dosageForm, status: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Notes</label>
                <textarea
                  value={dosageForm.notes}
                  onChange={(e) => setDosageForm({ ...dosageForm, notes: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                    isDark ? 'bg-teal-600 text-teal-100 hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'
                  }`}
                >
                  <FaSave /> {editingDosageId ? 'Update Dosage' : 'Add Dosage'}
                </motion.button>
                {editingDosageId && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={cancelEdit}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                      isDark ? 'bg-gray-600 text-gray-100 hover:bg-gray-700' : 'bg-gray-400 text-white hover:bg-gray-500'
                    }`}
                  >
                    <FaTimes /> Cancel
                  </motion.button>
                )}
              </div>
            </form>

            <div className="space-y-4">
              {dosages.map((dosage) => (
                <motion.div
                  key={dosage.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">{dosage.medication}</h3>
                      <p className="text-sm">Child ID: {dosage.child_id}</p>
                      <p className="text-sm">Condition: {dosage.condition || 'N/A'}</p>
                      <p className="text-sm">Dosage: {dosage.dosage}</p>
                      <p className="text-sm">Frequency: {dosage.frequency}</p>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => editDosage(dosage)}
                        className={`p-2 rounded-full ${
                          isDark ? 'bg-teal-600 text-teal-100' : 'bg-teal-500 text-white'
                        }`}
                      >
                        <FaEdit />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteDosage(dosage.id)}
                        className={`p-2 rounded-full ${
                          isDark ? 'bg-red-600 text-red-100' : 'bg-red-500 text-white'
                        }`}
                      >
                        <FaTrash />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}