'use client'

import React, { useState, useEffect } from 'react'

interface ClientOnlyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const ClientOnlyWrapper: React.FC<ClientOnlyWrapperProps> = ({
  children,
  fallback = <div>Loading...</div>,
}) => {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export default ClientOnlyWrapper
