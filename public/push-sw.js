// dokładane do service workera z workboxa (importScripts w vite.config.ts)
// push przychodzi pusty, więc tekst jest tutaj
self.addEventListener('push', (event) => {
  const scope = self.registration.scope
  event.waitUntil(
    self.registration.showNotification('Mind the Gap', {
      body: 'Dziś jeszcze nic. Zrób chociaż 5 minut: jedną serię albo fiszki.',
      icon: new URL('icon-192.png', scope).href,
      badge: new URL('icon-192.png', scope).href,
      tag: 'reminder',
      lang: 'pl',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // scope to adres aplikacji razem z VITE_BASE
  const scope = self.registration.scope
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.startsWith(scope))
      if (open) return open.focus()
      return self.clients.openWindow(scope)
    }),
  )
})
