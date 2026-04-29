/**
 * A fixed-size circular buffer that automatically evicts the oldest items
 * when the buffer is full. Useful for maintaining a rolling window of data.
 * Optimized for memory efficiency with proper nullification of evicted items.
 */
export class CircularBuffer<T> {
  private buffer: (T | null)[]
  private head = 0
  private size = 0

  constructor(private capacity: number) {
    this.buffer = new Array(capacity).fill(null)
  }

  /**
   * Add an item to the buffer. If the buffer is full,
   * the oldest item will be evicted.
   */
  add(item: T): void {
    if (this.size === this.capacity) {
      this.buffer[this.head] = null
    }
    this.buffer[this.head] = item
    this.head = (this.head + 1) % this.capacity
    if (this.size < this.capacity) {
      this.size++
    }
  }

  /**
   * Add multiple items to the buffer at once.
   */
  addAll(items: T[]): void {
    for (const item of items) {
      this.add(item)
    }
  }

  /**
   * Get the most recent N items from the buffer.
   * Returns fewer items if the buffer contains less than N items.
   */
  getRecent(count: number): T[] {
    const result: T[] = []
    const start = this.size < this.capacity ? 0 : this.head
    const available = Math.min(count, this.size)

    for (let i = 0; i < available; i++) {
      const index = (start + this.size - available + i) % this.capacity
      const item = this.buffer[index]
      if (item !== null) {
        result.push(item)
      }
    }

    return result
  }

  /**
   * Get all items currently in the buffer, in order from oldest to newest.
   */
  toArray(): T[] {
    if (this.size === 0) return []

    const result: T[] = []
    const start = this.size < this.capacity ? 0 : this.head

    for (let i = 0; i < this.size; i++) {
      const index = (start + i) % this.capacity
      const item = this.buffer[index]
      if (item !== null) {
        result.push(item)
      }
    }

    return result
  }

  /**
   * Clear all items from the buffer.
   */
  clear(): void {
    for (let i = 0; i < this.buffer.length; i++) {
      this.buffer[i] = null
    }
    this.head = 0
    this.size = 0
  }

  /**
   * Resize the buffer to a new capacity, preserving recent items.
   */
  resize(newCapacity: number): void {
    const items = this.toArray()
    this.clear()
    this.capacity = newCapacity
    this.buffer = new Array(newCapacity).fill(null)
    for (const item of items.slice(-newCapacity)) {
      this.add(item)
    }
  }

  /**
   * Get the current number of items in the buffer.
   */
  length(): number {
    return this.size
  }

  /**
   * Get the current capacity of the buffer.
   */
  getCapacity(): number {
    return this.capacity
  }
}
