'use client'

import { useEffect } from 'react'

export const HydrationFix = () => {
  useEffect(() => {
    // Remove problematic attributes that might cause hydration mismatches
    function cleanHydrationAttributes() {
      const html = document.documentElement

      // Remove data-arp attribute if it exists (commonly added by browser extensions)
      if (html.hasAttribute('data-arp')) {
        html.removeAttribute('data-arp')
      }

      // Remove other potentially problematic attributes
      const problematicAttrs = ['data-darkreader-mode', 'data-darkreader-scheme']
      problematicAttrs.forEach((attr) => {
        if (html.hasAttribute(attr)) {
          html.removeAttribute(attr)
        }
      })
    }

    // Run immediately
    cleanHydrationAttributes()

    // Run periodically to catch any attributes added by extensions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target === document.documentElement) {
          const attrName = mutation.attributeName
          if (
            attrName &&
            (attrName.startsWith('data-arp') || attrName.startsWith('data-darkreader'))
          ) {
            document.documentElement.removeAttribute(attrName)
          }
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-arp', 'data-darkreader-mode', 'data-darkreader-scheme'],
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return null // This component doesn't render anything
}

export default HydrationFix
