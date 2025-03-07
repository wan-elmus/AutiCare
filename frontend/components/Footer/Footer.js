'use client'
import { HeartIcon, ShieldCheckIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'

export default function Footer() {
  const { isDark } = useTheme()

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  }

  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInVariants}
      className={`mt-12 border-t ${isDark ? 'bg-gradient-to-t from-gray-900 via-teal-950 to-gray-900 border-gray-800' : 'bg-gradient-to-t from-teal-50 via-teal-100 to-blue-50 border-teal-200'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-teal-300' : 'text-teal-800'}`}>
              <HeartIcon className={`h-6 w-6 ${isDark ? 'text-teal-400' : 'text-teal-600'} animate-pulse-slow`} />
              AutiCare
            </h3>
            <p className={`text-sm ${isDark ? 'text-teal-400' : 'text-teal-600'} leading-relaxed`}>
              Empowering children with autism through compassionate monitoring and data-driven insights.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
              Resources
            </h4>
            <ul className="space-y-3">
              {[
                { href: '#', text: 'Getting Started' },
                { href: '#', text: 'Documentation' },
                { href: '#', text: 'Support Articles' },
              ].map((link, index) => (
                <motion.li
                  key={index}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <a
                    href={link.href}
                    className={`text-sm ${isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-500'} transition-colors duration-300`}
                  >
                    {link.text}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
              Legal
            </h4>
            <ul className="space-y-3">
              {[
                { href: '#', text: 'Privacy Policy' },
                { href: '#', text: 'Terms of Service' },
                { href: '#', text: 'Data Security' },
              ].map((link, index) => (
                <motion.li
                  key={index}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <a
                    href={link.href}
                    className={`text-sm ${isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-500'} transition-colors duration-300`}
                  >
                    {link.text}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
              Contact
            </h4>
            <div className="space-y-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2"
              >
                <PhoneIcon className={`h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                <span className={`text-sm ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                  +254 (740) 268 (061) AUT-CARE
                </span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2"
              >
                <EnvelopeIcon className={`h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                <a
                  href="mailto:support@auticare.com"
                  className={`text-sm ${isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-500'} transition-colors duration-300`}
                >
                  support@auticare.com
                </a>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2"
              >
                <ShieldCheckIcon className={`h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                <span className={`text-sm ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                  HIPAA Compliant
                </span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-teal-200/50 dark:border-teal-900/50 text-center">
          <p className={`text-xs ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
            © {new Date().getFullYear()} AutiCare Systems. All rights reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  )
}