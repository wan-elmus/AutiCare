'use client'
import { useState, useEffect, useContext, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { UserContext } from '@/context/UserContext'
import { FaPaperPlane, FaRobot, FaChartLine, FaArrowLeft } from 'react-icons/fa'

export default function ChatBot() {
  const { isDark } = useTheme()
  const { user } = useContext(UserContext)
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://195.7.7.15:8002'

  useEffect(() => {
    if (!user) {
      console.log('ChatBot: No user, redirecting to /auth/login')
      router.push('/auth/login')
      return
    }

    const fetchInsights = async () => {
      try {
        const res = await fetch(`${API_URL}/insights?email=${encodeURIComponent(user.email)}`)
        if (!res.ok) throw new Error(`Failed to fetch insights: ${res.status}`)
        const data = await res.json()
        setInsights(data.insights || [])
        console.log('ChatBot: Insights fetched:', data.insights)
      } catch (err) {
        console.error('ChatBot: Error fetching insights:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [user, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return
    const userMessage = { text: input, sender: 'user', timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')

    try {
      const res = await fetch(`${API_URL}/chat?email=${encodeURIComponent(user.email)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })
      if (!res.ok) throw new Error(`Failed to send message: ${res.status}`)
      const data = await res.json()
      const botMessage = { text: data.response, sender: 'bot', timestamp: data.timestamp }
      setMessages((prev) => [...prev, botMessage])
      console.log('ChatBot: Bot response:', data.response)
    } catch (err) {
      console.error('ChatBot: Error sending message:', err)
      setMessages((prev) => [
        ...prev,
        { text: 'Sorry, something went wrong. Please try again.', sender: 'bot', timestamp: new Date().toISOString() },
      ])
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (loading || !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <p className={`${isDark ? 'text-teal-400' : 'text-teal-600'}`}>Loading...</p>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDark ? 'bg-gradient-to-br from-gray-900 via-teal-950 to-gray-800' : 'bg-gradient-to-br from-teal-50 via-blue-50 to-teal-100'
      } pb-16`} // Added pb-16 to account for BottomMenu
    >
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-teal-600'} text-white flex items-center justify-between`}
      >
        <Link href="/" className="flex items-center gap-2">
          <FaArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </Link>
        <div className="flex items-center gap-3">
          <FaRobot className="h-6 w-6" />
          <h1 className="text-xl font-bold">AutiCare Assistant</h1>
        </div>
      </motion.header>

      <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full p-4 space-y-6">
        {/* Insights Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800 border-teal-700' : 'bg-white border-teal-200'} border`}
        >
          <div className="flex items-center gap-3 mb-4">
            <FaChartLine className={`h-6 w-6 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            <h2 className={`text-xl font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
              Personalized Insights
            </h2>
          </div>
          <AnimatePresence>
            {insights.length > 0 ? (
              insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 mb-2 rounded-lg ${isDark ? 'bg-gray-700 text-teal-200' : 'bg-teal-50 text-teal-800'}`}
                >
                  <p>{insight.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(insight.timestamp).toLocaleString()}
                  </p>
                </motion.div>
              ))
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${isDark ? 'text-teal-400' : 'text-teal-600'}`}
              >
                No insights available yet. Keep monitoring to receive recommendations.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Chat Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800 border-teal-700' : 'bg-white border-teal-200'} border`}
        >
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
            Chat with AutiCare Assistant
          </h2>
          <div className="h-96 overflow-y-auto mb-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-900">
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? isDark
                          ? 'bg-teal-600 text-white'
                          : 'bg-teal-500 text-white'
                        : isDark
                        ? 'bg-gray-700 text-teal-200'
                        : 'bg-gray-200 text-teal-800'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
          <div className="flex items-center gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about autism or your child..."
              rows={2}
              className={`flex-1 p-2 sm:p-3 rounded-lg border resize-none ${
                isDark ? 'bg-gray-700 border-teal-700 text-teal-200' : 'bg-white border-teal-200 text-teal-800'
              } focus:outline-none focus:border-teal-400 max-h-20 sm:max-h-24`}
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSendMessage}
              className={`p-3 rounded-lg ${
                isDark ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'
              }`}
            >
              <FaPaperPlane className="h-5 w-5" />
            </motion.button>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
