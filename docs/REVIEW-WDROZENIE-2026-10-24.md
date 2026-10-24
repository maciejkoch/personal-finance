# Realizacja review — 24.10.2026

Gałąź: `codex/ike-family-bond-options`. Zakres wynika z raportu `REVIEW-APLIKACJI-2026-10-23.md` i decyzji użytkownika z 24.10.2026.

## Treść

- Wszystkie trzy kalkulatory mają wyłącznie opcję „Pomiń podatek Belki”. IKE występuje w wyjaśnieniach bez przykładów; osobny parametr i jego reguły usunięto z kodu i Functions.
- Objaśnienia wskazują warunki zwolnienia, limity i koszty rachunku, odmienny sposób reinwestowania oraz opłaty przy różnych sposobach zakończenia IKE.
- W obu kalkulatorach oszczędzania dodano kapitał początkowy (domyślnie 0 zł). Ujednolicono poradnik, stronę „O nas”, metodologię, MathML, etykiety brutto/netto i opisy wyników. Istniejąca obietnica kapitału na stronie głównej ma pokrycie w funkcji.
- R1/R2 rozwiązano zmianą zakresu produktu na jawny scenariusz bez podatku. Nie powstał pełny model rachunku IKE.

## Działanie i kalkulatory

- Kapitał początkowy pracuje od początku, późniejsze wpłaty na koniec miesiąca. Podatek obejmuje zysk podczas symulacji, z zachowaniem modelu rozliczenia na koniec.
- Sam kapitał może wystarczyć do osiągnięcia celu; wtedy miesięczna wpłata wynosi zero. Regularne oszczędzanie dopuszcza zero wpłat przy dodatnim kapitale.
- R4: stabilny współczynnik renty korzysta z `expm1` i `log1p`; granica zerowej stopy nie zeruje kapitału ani nie tworzy ujemnego podatku.
- R5: maksymalnie 100 mln zł kapitału/celu, 1 mln zł miesięcznych wpłat i 1 bln zł wyniku. Wyniki są walidowane przed serializacją; niemożliwe scenariusze dają kontrolowany HTTP 400. Kwoty niewyrażalne przy wymaganej dokładności do grosza również są odrzucane.
- R6: edycja natychmiast anuluje poprzednie żądanie. Podczas debounce i żądania widać „Przeliczanie…”, spinner i oznaczenie poprzednich wyników. Status ma `aria-live`; błędy i retry są przy wyniku. Niepoprawne dane usuwają wyniki.
- R7: artykuły mają ładowanie, komunikat błędu i ponowienie; zmiana sluga usuwa starą treść i anuluje stare pobieranie.
- Ustawienia mają nowy, kompletny format: wersja 1 dla dwóch kalkulatorów oszczędzania i wersja 4 dla obligacji. Stare lub niepoprawne zapisy przywracają domyślne wartości, bez migracji.

## Kod

- K1: oddzielono samą preferencję podatku od nazw produktu; usunięto dawne reguły IKE i zgodność starego parametru.
- K2: współdzielone schematy Zod i jawne typy dla wyników obu kalkulatorów, kontrola skończoności i zakresu, walidacja kompletnej osi czasu i zgodności sum na froncie.
- K3: niezależne miesięczne przepływy kontrolują nowe obliczenia. Testy obejmują kapitał, zerowe wpłaty, cel zabezpieczony kapitałem, bardzo małe stopy, limity, błędne odpowiedzi, stan starego wyniku, anulowanie i retry oraz reset ustawień.
- K4: `.github/workflows/checks.yml` uruchamia lint obu części, testy, mutacje, niezależne referencje Decimal, produkcyjny build i kontrolę treści oraz smoke HTTP w izolowanym emulatorze projektu demo. Nie dodano automatycznego deployu ani zmian ochrony gałęzi.
- K5: bezpośrednie oznaczenie wartości brutto/netto, kapitału, późniejszych wpłat i zysku; poprawiony opis progu siły nabywczej.
- K6: wspólny komponent wykresu dla dwóch kalkulatorów, typowany canvas, aktualizacja po renderze i zwalnianie Chart.js przy usunięciu widoku.

## Diagnoza ochrony API

Przed wdrożeniem potwierdzono cztery Functions v2, Node 22, 256 MB, `maxInstances: 100`, concurrency 80. Funkcje są publiczne; kod dopuszcza wybrane originy CORS i waliduje dane oraz zakres pracy. Nie ma limitowania liczby wywołań per klient w kodzie. Limit instancji nie jest limitem żądań i nie gwarantuje maksymalnego kosztu. Nie wykonywano testu obciążeniowego ani audytu wszystkich polityk GCP poza konfiguracją Functions.

W uzgodnionym zakresie wykonano diagnozę, bez dodawania nowej płatnej usługi, logowania użytkowników ani blokowania ruchu infrastrukturalnym rate limiterem. Taki wybór wymaga osobnej decyzji na podstawie rzeczywistego ruchu i kosztów.

## Weryfikacja lokalna przed publikacją

- 145 testów backendu i 98 testów frontendu w 20 plikach — PASS.
- Lint frontend/Functions — PASS.
- 14/14 celowych mutacji wykrytych — PASS; niezależne referencje Decimal zgodne.
- Build produkcyjny z prerenderem oraz kontrola treści i Marked poza przeglądarką.
- Smoke HTTP w emulatorze: cztery endpointy, walidacja/CORS, wszystkie kombinacje podatku i dostępności rodzinnej, zachowane kwoty obligacji.
- `scripts/smoke-savings.mjs`: kapitał, brak późniejszych wpłat, pokryty cel, mała stopa, podatek, limity wejść i wyników; skrypt obsługuje też produkcję i oczekiwany identyfikator buildu.
- Przeglądarka lokalna: poprawny wynik netto 11 027,28 zł dla 10 000 zł kapitału, 12% nominalnie i jednego roku, widoczne przeliczanie/stary wynik oraz zerowa wymagana wpłata przy pokrytym celu. Podglądy: `docs/baseline/savings-starting-capital-2026-10-24.jpg` i `docs/baseline/savings-covered-goal-2026-10-24.jpg`.

Poprzednia wersja Hostingu przed tą publikacją: `b25192505267d525`. Kod sprzed zmian: `387664b`. Nowe wydanie wymaga publikacji Functions przed Hostingiem; po publikacji sprawdzane są buildy i skrypty smoke na produkcji. Publikację, commit i push z tej gałęzi użytkownik wyraźnie zlecił.
