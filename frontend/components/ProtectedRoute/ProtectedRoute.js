'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProtectedRoute({ children }) {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:8000/users/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          router.push('/auth/login');
        }
      } catch (error) {
        router.push('/auth/login');
      }
    }

    checkAuth();
  }, []);

  return children;
}