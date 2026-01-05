
// Ce Service Worker est requis pour que Chrome détecte l'app comme "Installable" (PWA).
// Nous n'utilisons pas de stratégie de cache complexe ici car l'app dépend de Supabase (online).

self.addEventListener('install', (event) => {
  // Force l'activation immédiate
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Prend le contrôle des clients immédiatement
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // On ne fait RIEN : on laisse toutes les requêtes passer vers le réseau normalement.
  // Cela évite les problèmes de cache obsolète.
  return;
});
