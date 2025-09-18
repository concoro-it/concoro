/**
 * Performance monitoring utilities for tracking filter and API performance
 */

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric>()
  private isEnabled = process.env.NODE_ENV === 'development'
  
  /**
   * Start tracking a performance metric
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return
    
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    })
    
    console.log(`🚀 Performance tracking started: ${name}`, metadata)
  }
  
  /**
   * End tracking a performance metric
   */
  end(name: string, additionalMetadata?: Record<string, any>): number | null {
    if (!this.isEnabled) return null
    
    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`⚠️ Performance metric not found: ${name}`)
      return null
    }
    
    const endTime = performance.now()
    const duration = endTime - metric.startTime
    
    metric.endTime = endTime
    metric.duration = duration
    
    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata }
    }
    
    // Log performance result with color coding
    const emoji = duration < 100 ? '🟢' : duration < 500 ? '🟡' : '🔴'
    console.log(`${emoji} Performance: ${name} completed in ${duration.toFixed(2)}ms`, metric.metadata)
    
    // Clean up
    this.metrics.delete(name)
    
    return duration
  }
  
  /**
   * Measure an async operation
   */
  async measure<T>(name: string, operation: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name, metadata)
    try {
      const result = await operation()
      this.end(name, { success: true })
      return result
    } catch (error) {
      this.end(name, { success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }
  
  /**
   * Measure a synchronous operation
   */
  measureSync<T>(name: string, operation: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata)
    try {
      const result = operation()
      this.end(name, { success: true })
      return result
    } catch (error) {
      this.end(name, { success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }
  
  /**
   * Get all active metrics (for debugging)
   */
  getActiveMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values())
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor() {
  return {
    start: performanceMonitor.start.bind(performanceMonitor),
    end: performanceMonitor.end.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    measureSync: performanceMonitor.measureSync.bind(performanceMonitor)
  }
}

/**
 * Higher-order component for performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    const { measureSync } = usePerformanceMonitor()
    
    return measureSync(
      `render-${componentName}`,
      () => <Component {...props} />,
      { componentName }
    )
  }
}

/**
 * Decorator for class methods
 */
export function performanceDecorator(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const methodName = name || `${target.constructor.name}.${propertyKey}`
    
    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(
        methodName,
        () => originalMethod.apply(this, args),
        { args: args.length }
      )
    }
    
    return descriptor
  }
}
