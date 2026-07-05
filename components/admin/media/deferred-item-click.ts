export type DeferredItemClickHandle = {
  schedule: (id: string, run: () => void) => void
  cancel: (id: string) => void
  cancelAll: () => void
}

export function createDeferredItemClickHandle(delayMs = 250): DeferredItemClickHandle {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  return {
    schedule(id, run) {
      const existing = timers.get(id)
      if (existing) clearTimeout(existing)
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id)
          run()
        }, delayMs)
      )
    },
    cancel(id) {
      const existing = timers.get(id)
      if (existing) {
        clearTimeout(existing)
        timers.delete(id)
      }
    },
    cancelAll() {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    },
  }
}
