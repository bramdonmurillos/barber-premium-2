import { useTheme } from '../../contexts/ThemeContext'

const options = [
  {
    value: 'system',
    label: 'Sistema',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: 'light',
    label: 'Claro',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Oscuro',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
]

export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useTheme()

  if (compact) {
    // Toggle between light and dark directly (skip 'system' in compact mode)
    const nextTheme = (t) => {
      if (t === 'dark') return 'light'
      if (t === 'light') return 'dark'
      return 'light' // system → light
    }
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const current = isDark ? options[2] : options[1]
    return (
      <button
        onClick={() => setTheme(nextTheme(theme))}
        title={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {current.icon}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 bg-gray-800 dark:bg-gray-800 rounded-lg p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          title={option.label}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            theme === option.value
              ? 'bg-gold text-black'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  )
}
