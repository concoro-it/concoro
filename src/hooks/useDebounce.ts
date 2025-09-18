import { useEffect, useState } from 'react'

/**
 * Custom hook for debouncing values
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook for debouncing multiple values as an object
 * @param values Object with values to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced values object
 */
export function useDebounceObject<T extends Record<string, any>>(values: T, delay: number): T {
  const [debouncedValues, setDebouncedValues] = useState<T>(values)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValues(values)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [JSON.stringify(values), delay])

  return debouncedValues
}

/**
 * Custom hook for debouncing with immediate execution on first call
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @param immediate Whether to execute immediately on first call
 * @returns The debounced value
 */
export function useDebounceImmediate<T>(value: T, delay: number, immediate: boolean = false): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const [isFirstCall, setIsFirstCall] = useState(true)

  useEffect(() => {
    if (immediate && isFirstCall) {
      setDebouncedValue(value)
      setIsFirstCall(false)
      return
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value)
      setIsFirstCall(false)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay, immediate, isFirstCall])

  return debouncedValue
}
