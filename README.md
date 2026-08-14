# SUPER MAMA JULIA 64 — Phone / GitHub Pages

## Kein Terminal / kein npm

Dieses Paket ist für direkten Betrieb über GitHub Pages ausgelegt.

- `index.html` ist der Browser-Einstiegspunkt.
- `src/` enthält den getrennten JavaScript-Source.
- Three.js wird direkt als ES-Modul von unpkg geladen.
- Es gibt keinen Build-Schritt.

## Diagnose

Der Einstieg besitzt einen sichtbaren Boot-Screen. Wenn `main.js`, Three.js oder die Game-Initialisierung fehlschlägt, bleibt der Boot-Screen sichtbar und zeigt den technischen Fehler an, statt nur einen schwarzen Bildschirm zu liefern.
