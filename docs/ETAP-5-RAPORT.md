# Etap 5 — Angular 19 → 20

Stan: 22.10.2026. Implementacja i lokalne testy odbiorcze zakończone. Bazowy commit: `6c07a2e`, po wdrożeniu etapu 4. Poniżej zapis kontroli wersji pośredniej Angular 20. Następnie, na prośbę użytkownika, kontynuowano do [Angular 22 w etapie 7](ETAP-7-RAPORT.md). Nie wykonano commita, pusha ani wdrożenia.

## Zmiany

- Uruchomiono oficjalne `ng update` dla Angular core/CLI/SSR oraz NgRx Signals/Operators, razem ze zgodnymi zależnościami narzędziowymi. Instalacja i migracje przeszły bez `--force` i `--legacy-peer-deps`.
- Migracja CLI przeniosła `provideServerRendering` do `@angular/ssr`, ustawiła rozwiązywanie modułów TypeScript na `bundler` i zachowała dotychczasowe nazewnictwo plików generowanych przez schematics.
- Migracja core przeniosła `DOCUMENT` do `@angular/core` i przekazała `BootstrapContext` do serwerowego `bootstrapApplication`. Pozostałe wymagane migracje core i migracja `tapResponse` NgRx Operators nie wymagały zmian źródeł. NgRx Signals 20 nie zawiera dodatkowej migracji z wersji 19.
- Dla testów Jest z modułami CommonJS jawnie zachowano `moduleResolution: node` w `tsconfig.spec.json`. Sam Jest przechodził po migracji, ale osobne `tsc --noEmit` wykryło niezgodne dziedziczenie `bundler`; po poprawce oba sprawdzenia przechodzą.
- Zachowano Jest 29 i dziewięć istniejących zestawów testów. Preset zaktualizowano do wydania 14.6.2 obsługującego Angular 20. Migracja runnera pozostaje w etapie 7.

| Pakiety | Przed | Po |
| --- | --- | --- |
| Angular core, compiler, formularze, router i platformy | 19.0.0 | 20.3.34 |
| Angular CLI, build-angular, SSR | 19.0.0 | 20.3.40 |
| NgRx Signals / Operators | 19.0.0 | 20.1.0 |
| TypeScript | 5.5.4 | 5.9.3 |
| Angular ESLint | 18.4.1 | 20.7.0 |
| TypeScript ESLint | 8.15.0 | 8.72.0 |
| Typy Node | 18.16.9 | 22.20.5 |
| Jest / jest-preset-angular / ts-jest | 29.7.0 / 14.4.2 / 29.2.5 | 29.7.0 / 14.6.2 / 29.4.15 |
| RxJS | 7.8.1 | 7.8.2 |
| PostCSS / autoprefixer | 8.4.49 / 10.4.20 | 8.5.23 / 10.4.21 |

Wersje sprawdzono w rejestrze npm przed migracją. Node 22.23.2 z `.nvmrc` mieści się w zakresach zgodności Angular 19 i 20.3; TypeScript 5.9.3 jest zgodny z Angular 20.3. Źródło: [oficjalna macierz Angular](https://angular.dev/reference/versions). Migrację wykonano zgodnie z [przewodnikiem Angular](https://angular.dev/update-guide) i schematics dostarczonymi przez zainstalowane pakiety.

Tailwind 3.4.15, daisyUI 4.12.14, Chart.js 4.4.6, Lodash 4.17.21, Zod 3.23.8 i zone.js 0.15.0 pozostały bez zmiany wersji. Zachowano formularze, SignalStore, konfigurację detekcji zmian i hydratację. Źródła i lockfile Functions, oferta obligacji, kontrakty API i reguły obliczeń nie zostały zmienione.

## Weryfikacja

| Sprawdzenie | Wynik |
| --- | --- |
| Bazowe testy i lint przed migracją | 23 testy w 9 zestawach, lint OK |
| Bazowy build Angular 19 | 8 prerenderowanych tras, OK |
| Czysta instalacja końcowego lockfile: `npm ci --offline --no-audit --no-fund` | OK |
| `npm ls --all` | OK, bez konfliktów i nieprawidłowych zależności |
| `npm test` po czystej instalacji | 23 testy w 9 zestawach, OK |
| `npm run lint` | OK, bez ostrzeżeń i błędów |
| `tsc -p tsconfig.spec.json --noEmit` | OK |
| `npm run test:functions` | 36 testów, OK |
| `env -u NODE_TLS_REJECT_UNAUTHORIZED NG_BUILD_MAX_WORKERS=2 npm run build` po czystej instalacji | 8 prerenderowanych tras, finalizacja 404, OK |
| `npm start` | Angular CLI 20 na `http://localhost:4300`, lokalne API emulatora |
| `node scripts/smoke-hosting.mjs http://127.0.0.1:5050` | 7 stron 200, przekierowania 301, brakujące strony 404, robots, sitemap, metadane i JSON-LD |
| Zasoby na lokalnym Hostingu | 43 pliki JS/CSS/obrazów/ikon: HTTP 200, zgodność bajtów z artefaktem |
| `npm run preview:prepare` | Wszystkie HTML preview mają `noindex, follow`; produkcyjny HTML zachowuje `index, follow` |
| `npm run smoke:api -- --contracts --compare-production` | Cztery endpointy: lokalny JSON zgodny z produkcją, walidacja i CORS OK |
| `git diff --check` | OK |

Build bazowy nie zakończył się w ograniczonym sandboxie; oba pełne buildy wykonano poza nim. Po migracji pozostało ostrzeżenie CommonJS Lodash. Dotychczasowe ostrzeżenia selektorów daisyUI `.tooltip:has()` nie występują w nowym buildzie.

### Zgodność artefaktu

Porównano osiem dokumentów HTML ze zbudowaną wersją bazową: treść, DOM i metadane, w tym JSON-LD, są identyczne po pominięciu wewnętrznych atrybutów Angulara, komentarzy, skryptów wykonawczych oraz stylów i odwołań do bundli. Zachowano te same URL i treści publicznych stron.

Wielkość początkowych bundli wzrosła z 424,10 kB do 435,89 kB; pozostaje poniżej istniejącego progu ostrzegania 500 kB. CSS jest ponownie generowany przez zaktualizowane narzędzia; jego zgodność wizualną sprawdzono w przeglądarce, nie zakładano identyczności bajtów z wersją Angular 19.

### Przeglądarka

Testy formularzy wykonano przez `npm start` na porcie 4300 z lokalnym emulatorem Functions. Gotowy artefakt produkcyjny sprawdzono osobno przez emulator Hostingu na porcie 5050. Port 5050 nie należy do produkcyjnej listy CORS; nie rozszerzano jej na potrzeby tych testów.

- Angular potwierdził hydratację strony obligacji: 13 komponentów, 305 węzłów, 0 pominiętych komponentów. Nie odnotowano błędów konsoli ani ostrzeżeń hydratacji. Informacja NG0751 w trybie HMR opisuje standardowe eager loading bloków `@defer` podczas developmentu.
- Obligacje: 10 sztuk / 2 lata, najwyższa wartość ROD 1072,41 zł. Liczba obligacji i okres przetrwały odświeżenie; tabela i wykres działają.
- Regularne wpłaty: 500 zł miesięcznie / 2 lata / stopa 5%, kapitał po podatku 12 480,30 zł. Formularz przelicza wynik, wykres jest widoczny.
- Cel: 10 000 zł / 2 lata / inflacja 3% / stopa 5%, miesięczna wpłata 425,03 zł. Wszystkie cztery wartości i wynik przetrwały odświeżenie. Wykres reaguje na zmianę szerokości.
- Wyniki tych trzech scenariuszy są zgodne z kontrolą etapu 4. Nawigacja klienta między kalkulatorami aktualizuje tytuły i ładuje właściwe formularze.
- Widok 390 × 844: formularz, wynik i wykres celu mieszczą się bez poziomego przewijania. Mobilne menu umożliwia przejścia między kalkulatorami.

## Przegląd i publikacja

Wersja Angular 20 przeszła lokalny odbiór. Na prośbę użytkownika kontynuowano migracje Angular 21 i 22, bez publikacji wersji pośrednich. Aktualny stan opisuje [raport etapu 7](ETAP-7-RAPORT.md). Functions nie wymagają wdrożenia.
