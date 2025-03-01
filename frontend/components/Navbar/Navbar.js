// components/Navbar.js
'use client'
import { useTheme } from '@/context/ThemeContext'
import { MoonIcon, SunIcon, UserCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Navbar({ userData }) {
  const { isDark, toggleTheme } = useTheme()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const router = useRouter()

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left Side - Logo */}
          <div className="flex items-center">
            <span className="flex items-center text-2xl font-bold text-blue-600 dark:text-blue-400">
              <Cog6ToothIcon className="h-8 w-8 mr-2" />
              AutiCare
            </span>
          </div>

          {/* Right Side - Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <SunIcon className="h-6 w-6 text-yellow-400" />
              ) : (
                <MoonIcon className="h-6 w-6 text-gray-600" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="User profile"
              >
                <UserCircleIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 border border-gray-100 dark:border-gray-700">
                  <ProfileDropdown userData={userData} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

function ProfileDropdown({ userData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    childName: userData?.child_name || '',
    childAge: userData?.child_age || '',
    childBio: userData?.child_bio || '',
    currentPassword: '',
    newPassword: '',
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="p-4 space-y-4">
      {isEditing ? (
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Child's Name
            </label>
            <input
              type="text"
              value={formData.childName}
              onChange={(e) =>
                setFormData({ ...formData, childName: e.target.value })
              }
              className="w-full p-2 mt-1 rounded border dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Child's Age
            </label>
            <input
              type="number"
              value={formData.childAge}
              onChange={(e) =>
                setFormData({ ...formData, childAge: e.target.value })
              }
              className="w-full p-2 mt-1 rounded border dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Bio
            </label>
            <textarea
              value={formData.childBio}
              onChange={(e) =>
                setFormData({ ...formData, childBio: e.target.value })
              }
              className="w-full p-2 mt-1 rounded border dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              New Password
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              className="w-full p-2 mt-1 rounded border dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="space-y-2">
            <h3 className="font-medium dark:text-gray-200">
              {userData?.child_name || 'Child Name'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Age: {userData?.child_age}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {userData?.child_bio}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-2 px-4 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit Profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}
