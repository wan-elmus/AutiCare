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
  const [caregiverForm, setCaregiverForm] = useState({ name: '', email: '', phone: '', relation_type: '' })
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
  const [successMessage, setSuccessMessage] = useState('') // New state for success messages
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://195.7.7.15:8002'

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    console.log('Profile: UserContext user:', user)
    if (!user || !user.email) {
      router.push('/auth/login')
      return
    }
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchCaregiver(), fetchChildren(), fetchDosages()])
      } catch (err) {
        setError('Failed to load profile data')
        console.error('Profile load error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user, router])

  const fetchCaregiver = async () => {
    try {
      const res = await fetch(`${API_URL}/caregivers/me?email=${encodeURIComponent(user.email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (res.status === 404) {
        setCaregiver(null)
        setCaregiverForm({
          name: '',
          email: user.email,
          phone: '',
          relation_type: ''
        })
        return
      }
      
      if (!res.ok) {
        throw new Error('Failed to fetch caregiver')
      }
      
      const data = await res.json()
      setCaregiver(data)
      setCaregiverForm({
        name: data.name || '',
        email: data.email,
        phone: data.phone || '',
        relation_type: data.relation_type || ''
      })
    } catch (err) {
      setError(err.message)
      console.error('Fetch caregiver error:', err)
      throw err
    }
  }

  const fetchChildren = async () => {
    try {
      const res = await fetch(`${API_URL}/children?email=${encodeURIComponent(user.email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'No children found' : 'Failed to fetch children')
      }
      
      const data = await res.json()
      setChildren(data)
    } catch (err) {
      setError(err.message)
      console.error('Fetch children error:', err)
      throw err
    }
  }

  const fetchDosages = async () => {
    try {
      const res = await fetch(`${API_URL}/dosages?email=${encodeURIComponent(user.email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'No dosages found' : 'Failed to fetch dosages')
      }
      
      const data = await res.json()
      setDosages(data)
    } catch (err) {
      setError(err.message)
      console.error('Fetch dosages error:', err)
      throw err
    }
  }

  const handleCaregiverSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    
    try {
      if (!caregiverForm.name) {
        throw new Error('Name is required')
      }
      if (!user.email) {
        throw new Error('User email is missing. Please log in again.')
      }

      const payload = { ...caregiverForm, email: user.email }
      console.log('Profile: Sending PUT /caregivers/me with payload:', payload)

      const res = await fetch(`${API_URL}/caregivers/me?email=${encodeURIComponent(user.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(
          errorData.detail
            ? Array.isArray(errorData.detail)
              ? errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('; ')
              : errorData.detail
            : 'Failed to update caregiver'
        )
      }
      
      const updatedCaregiver = await res.json()
      setCaregiver(updatedCaregiver)
      setCaregiverForm({
        name: '',
        email: user.email,
        phone: '',
        relation_type: ''
      })
      setSuccessMessage('Caregiver profile updated successfully!')
      console.log('Profile: Caregiver updated:', updatedCaregiver)
    } catch (err) {
      setError(err.message)
      console.error('Profile update error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChildSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    
    try {
      if (!childForm.name) {
        throw new Error('Child name is required')
      }
      if (childForm.age && isNaN(childForm.age)) {
        throw new Error('Age must be a number')
      }

      const method = editingChildId ? 'PUT' : 'POST'
      const url = editingChildId
        ? `${API_URL}/children/${editingChildId}?email=${encodeURIComponent(user.email)}`
        : `${API_URL}/children?email=${encodeURIComponent(user.email)}`
      
      console.log('Profile: Sending', method, url, 'with payload:', childForm)

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(childForm),
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to save child')
      }
      
      await fetchChildren()
      setChildForm({
        name: '', age: '', gender: '', conditions: '', allergies: '', milestones: '',
        behavioral_notes: '', emergency_contacts: '', medical_history: ''
      })
      setEditingChildId(null)
      setSuccessMessage(editingChildId ? 'Child profile updated successfully!' : 'Child profile added successfully!')
      console.log('Profile: Child saved:', childForm)
    } catch (err) {
      setError(err.message)
      console.error('Child submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDosageSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    
    try {
      if (!dosageForm.child_id || !dosageForm.medication || !dosageForm.start_date || !dosageForm.dosage) {
        throw new Error('Child, medication, start date, and dosage are required')
      }

      const method = editingDosageId ? 'PUT' : 'POST'
      const url = editingDosageId
        ? `${API_URL}/dosages/${editingDosageId}?email=${encodeURIComponent(user.email)}`
        : `${API_URL}/dosages?email=${encodeURIComponent(user.email)}`
      
      const payload = {
        ...dosageForm,
        intervals: dosageForm.intervals.length ? dosageForm.intervals : ['00:00'],
      }
      console.log('Profile: Sending', method, url, 'with payload:', payload)

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to save dosage')
      }
      
      await fetchDosages()
      setDosageForm({
        child_id: '', medication: '', condition: '', start_date: '', dosage: '',
        frequency: 'daily', intervals: [], status: 'active', notes: ''
      })
      setEditingDosageId(null)
      setSuccessMessage(editingDosageId ? 'Dosage updated successfully!' : 'Dosage added successfully!')
      console.log('Profile: Dosage saved:', payload)
    } catch (err) {
      setError(err.message)
      console.error('Dosage submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteChild = async (id) => {
    if (!window.confirm('Are you sure you want to delete this child?')) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const res = await fetch(`${API_URL}/children/${id}?email=${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!res.ok) {
        throw new Error('Failed to delete child')
      }
      
      setChildren(children.filter(child => child.id !== id))
      setSuccessMessage('Child profile deleted successfully!')
      console.log('Profile: Child deleted:', id)
    } catch (err) {
      setError(err.message)
      console.error('Delete child error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDosage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dosage?')) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const res = await fetch(`${API_URL}/dosages/${id}?email=${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!res.ok) {
        throw new Error('Failed to delete dosage')
      }
      
      setDosages(dosages.filter(dosage => dosage.id !== id))
      setSuccessMessage('Dosage deleted successfully!')
      console.log('Profile: Dosage deleted:', id)
    } catch (err) {
      setError(err.message)
      console.error('Delete dosage error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const editChild = (child) => {
    setChildForm(child)
    setEditingChildId(child.id)
    setError('')
  }

  const editDosage = (dosage) => {
    setDosageForm(dosage)
    setEditingDosageId(dosage.id)
    setError('')
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
        <p className={`${isDark ? 'text-teal-400' : 'text-teal-600'}`}>Loading profile...</p>
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

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`p-3 mb-4 rounded-md ${
            isDark ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'
          }`}
        >
          {successMessage}
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`p-3 mb-4 rounded-md ${
            isDark ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'
          }`}
        >
          {error}
        </motion.div>
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
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={caregiverForm.name}
                  onChange={(e) => setCaregiverForm({ ...caregiverForm, name: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={caregiverForm.email}
                    disabled
                    className={`mt-1 p-2 w-full rounded-md border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-gray-200 border-gray-300 text-gray-600'
                    }`}
                  />
                  <span className="absolute top-0 right-2 text-xs text-gray-500 dark:text-gray-400">
                    Email cannot be changed here
                  </span>
                </div>
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
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                  isDark ? 'bg-teal-600 text-teal-100 hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FaSave /> {isSubmitting ? 'Saving...' : 'Save Profile'}
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
                <label className="block text-sm font-medium">Name*</label>
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
                  min="0"
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
              <div>
                <label className="block text-sm font-medium">Milestones</label>
                <textarea
                  value={childForm.milestones}
                  onChange={(e) => setChildForm({ ...childForm, milestones: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Behavioral Notes</label>
                <textarea
                  value={childForm.behavioral_notes}
                  onChange={(e) => setChildForm({ ...childForm, behavioral_notes: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Emergency Contacts</label>
                <textarea
                  value={childForm.emergency_contacts}
                  onChange={(e) => setChildForm({ ...childForm, emergency_contacts: e.target.value })}
                  className={`mt-1 p-2 w-full rounded-md border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Medical History</label>
                <textarea
                  value={childForm.medical_history}
                  onChange={(e) => setChildForm({ ...childForm, medical_history: e.target.value })}
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
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                    isDark ? 'bg-teal-600 text-teal-100 hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FaSave /> {isSubmitting ? 'Saving...' : editingChildId ? 'Update Child' : 'Add Child'}
                </motion.button>
                {editingChildId && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={cancelEdit}
                    disabled={isSubmitting}
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
              {children.length === 0 ? (
                <p className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No children added yet
                </p>
              ) : (
                children.map((child) => (
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
                        {child.conditions && (
                          <p className="text-sm">Conditions: {child.conditions}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => editChild(child)}
                          disabled={isSubmitting}
                          className={`p-2 rounded-full ${
                            isDark ? 'bg-teal-600 text-teal-100' : 'bg-teal-500 text-white'
                          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <FaEdit />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteChild(child.id)}
                          disabled={isSubmitting}
                          className={`p-2 rounded-full ${
                            isDark ? 'bg-red-600 text-red-100' : 'bg-red-500 text-white'
                          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <FaTrash />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
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
                <label className="block text-sm font-medium">Child*</label>
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
                <label className="block text-sm font-medium">Medication*</label>
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
                <label className="block text-sm font-medium">Start Date*</label>
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
                <label className="block text-sm font-medium">Dosage*</label>
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
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                    isDark ? 'bg-teal-600 text-teal-100 hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FaSave /> {isSubmitting ? 'Saving...' : editingDosageId ? 'Update Dosage' : 'Add Dosage'}
                </motion.button>
                {editingDosageId && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={cancelEdit}
                    disabled={isSubmitting}
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
              {dosages.length === 0 ? (
                <p className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No dosages added yet
                </p>
              ) : (
                dosages.map((dosage) => (
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
                        <p className="text-sm">For: {children.find(c => c.id === dosage.child_id)?.name || 'Unknown child'}</p>
                        <p className="text-sm">Dosage: {dosage.dosage}</p>
                        <p className="text-sm">Frequency: {dosage.frequency}</p>
                        {dosage.condition && (
                          <p className="text-sm">Condition: {dosage.condition}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => editDosage(dosage)}
                          disabled={isSubmitting}
                          className={`p-2 rounded-full ${
                            isDark ? 'bg-teal-600 text-teal-100' : 'bg-teal-500 text-white'
                          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <FaEdit />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteDosage(dosage.id)}
                          disabled={isSubmitting}
                          className={`p-2 rounded-full ${
                            isDark ? 'bg-red-600 text-red-100' : 'bg-red-500 text-white'
                          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <FaTrash />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}