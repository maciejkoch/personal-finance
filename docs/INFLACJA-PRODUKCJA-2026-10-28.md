# Inflacja GUS — produkcja 28.10.2026

Działa pod [oszczedzify.org/inflacja](https://oszczedzify.org/inflacja). Wdrożenie z izolowanego worktree na wersji `ffe2b51`, zawierającej aktualny `origin/main` ze zgodą na cookies. Nie dołączono lokalnych niezatwierdzonych zmian parsera obligacji.

## Zasoby i konfiguracja

- Istniejące Firestore Standard Native `(default)` i prywatny bucket `personal-finance-2ee61-bond-sources`, region `europe-central2`. Public Access Prevention nadal enforced.
- Wdrożone wyłączenia indeksowania historii, `inflationWarsaw`, `syncInflation` i aktualizacja `calculateSavingsWarsaw` obsługująca deflację. Pozostałe funkcje i importer obligacji nie były wdrażane.
- App Check pozostaje w trybie `enforce`; funkcje weryfikują prawdziwe tokeny. Testy chronionego API użyły krótkotrwałego tokenu wystawionego przez oficjalne `mintAppCheckToken` z istniejącymi uprawnieniami operatora, bez tworzenia debug tokenów lub zmian ochrony.
- CSV pobrany bezpośrednio z GUS i zarchiwizowany prywatnie. SHA-256 źródła: `ab5bc7d89d3cd53aa288a16d12da678368588a86d05d505de2449728a597dd04`.
- Dataset `90f4a3e07bb1992bbf081c7f8d86a4ba129061b68ee83c0069e58a668a69cf17`: 537 miesięcy od 1982-01 do 2026-09, ostatnia inflacja 4,1% r/r.
- `INFLATION_IMPORT_ENABLED=true`. Scheduler `firebase-schedule-syncInflation-europe-central2`: enabled, `0 8,20 * * *`, `Europe/Warsaw`.
- Pierwszy kontrolowany run Scheduler: log `INFLATION_IMPORT_SUCCEEDED` o 09:43:55 czasu Warszawy. Status bazy: `unchanged`; ostatni sukces `2026-10-28T08:43:54.888Z`. Potwierdza pobieranie GUS oraz dostęp do Firestore i Storage z produkcyjnego konta wykonawczego.
- Licznik `inflation_import_success` i dwie polityki alertów błędu/braku sukcesu przez 23,5 godziny, z tym samym istniejącym kanałem operatora co obligacje. Alert błędu obejmuje również nieaktualny okres CPI.

## Weryfikacja

- Czysta wersja z aktualnym main: 167 testów backendu i 158 testów Angulara, lint obu pakietów: PASS.
- Build produkcyjny i prerender 10 tras, kontrola treści/SEO oraz produkcyjny smoke hostingu: PASS. Początkowy bundle 501,2 kB zgłasza ostrzeżenie dla progu 500 kB; pozostaje poniżej limitu błędu 1 MB.
- Produkcyjne API: 200 dla poprawnego App Check, 401 dla braku/fałszywego tokenu, poprawny CORS/preflight, 400 dla niepoprawnych parametrów i 405 dla POST: PASS.
- Trzy strony historii z jednym datasetId, 537 punktów i zgodność ostatniego punktu z bieżącym odczytem: PASS.
- Kalkulator celu: 10 000 zł, rok, deflacja −2%, stopa 0% → cel 9 800 zł: PASS. Istniejące API regularnych wpłat i katalogu obligacji: PASS.
- Rzeczywista przeglądarka produkcyjna: wykres i tabela, menu Inflacja, zakres 10 lat zachowujący scroll 720 px, działający consent cookies. FIRE: ręczne 6% → przycisk 4,1% przywraca GUS i przelicza wynik. Cel: wcześniejsze własne 0% pozostaje zachowane i jest dostępny przycisk 4,1%.
- Podgląd produkcji: [production.png](inflation/production.png).

## Rollback

Poprzednia wersja Hostingu: `sites/personal-finance-2ee61/versions/9d642e854501ea87` (release `1793172347684000`). W razie potrzeby przywrócić poprzedni Hosting i wyłączyć harmonogram inflacji, pozostawiając bazę oraz źródła. Standardowe korekty/wycofanie danych opisuje instrukcja wdrożeniowa. Tymczasowy plik ADC użyty do pierwszego importu został usunięty po zakończeniu; poświadczenia nie trafiły do repozytorium ani raportu.
