# Firebase App Check — wdrożenie 26.10.2026

Wdrożono produkcyjnie z brancha `codex/firebase-app-check`, commit aplikacji `7cd14ce61531b518cff1588e98579376cd62cf7e`. PR #2 pozostaje otwarty; wdrożenie nie wymagało scalenia do `main`.

## Stan konfiguracji

- Projekt: `personal-finance-2ee61`, aplikacja Web: `1:850956574248:web:e8f8affa8457cfe578df1d`.
- Włączono reCAPTCHA Enterprise API. Utworzono klucz SCORE `Oszczedzify App Check production`, ograniczony do domen `oszczedzify.org`, `personal-finance-2ee61.web.app`, `personal-finance-2ee61.firebaseapp.com`.
- Provider App Check: reCAPTCHA Enterprise, TTL `3600s`, minimalna ocena `0.5`.
- Frontend `public/app-check.json`: `mode=enforce`.
- Wszystkie osiem funkcji HTTP w Warszawie i USA: `APP_CHECK_MODE=enforce`, `APP_CHECK_APP_IDS=1:850956574248:web:e8f8affa8457cfe578df1d`.
- Zmienne produkcyjne zachowano w ignorowanym pliku `functions/.env.personal-finance-2ee61`. Istniejące ustawienia importera obligacji pozostawiono aktywne.

## Przebieg i weryfikacja

Najpierw wdrożono Functions i Hosting w trybie `monitor`. W rzeczywistej przeglądarce sprawdzono kalkulatory regularnego oszczędzania, celu i obligacji; Cloud Logging potwierdził poprawne tokeny `outcome=valid`. Następnie wdrożono frontend `enforce`, a po nim Functions `enforce`.

Potwierdzono stan `ACTIVE` i docelowy tryb wszystkich funkcji przez Cloud Functions API. Wykonano produkcyjny odpowiednik `scripts/smoke-app-check.mjs`: każde z ośmiu API zwraca HTTP 401 dla braku tokenu i dla fałszywego tokenu, z `Cache-Control: no-store`. Każdy preflight OPTIONS zwraca 204 i dopuszcza nagłówek App Check. Po aktywacji ochrony ponownie sprawdzono trzy kalkulatory oraz artykuł przez nawigację klienta. Logi wszystkich czterech funkcji warszawskich potwierdzają poprawne tokeny w trybie `enforce`; konsola przeglądarki nie zgłasza błędów.

Build produkcyjny ze statystykami i kontrola treści przeszły; prerender obejmuje osiem tras, początkowa paczka ma 469,14 kB. Wcześniejsza walidacja implementacji: 112 testów frontendu, 160 backendu, testy emulatora App Check, regresje API i 14 testów mutacyjnych.

## Kolejne wdrożenia i rollback

Przed kolejnym deployem Functions zachowaj wartości `APP_CHECK_MODE` i `APP_CHECK_APP_IDS` z produkcyjnego pliku env. Na nowym komputerze odtwórz te dwie wartości, zachowując pozostałe ustawienia środowiska. Bez jawnego trybu backend domyślnie wybiera `off`.

Rollback ochrony: najpierw ustaw backend `APP_CHECK_MODE=monitor` i wdróż Functions, dopiero potem wyłącz klienta (`mode=off`) i wdróż Hosting. Pełny opis: [FIREBASE-APP-CHECK.md](FIREBASE-APP-CHECK.md).
