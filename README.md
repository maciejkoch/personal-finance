# Oszczędzify

Kalkulatory finansowe w jednej aplikacji Angular CLI 22 oraz osobny backend Firebase Functions. Frontend działa bez Zone.js, korzysta z NgRx SignalStore i Signal Forms we wszystkich trzech kalkulatorach. Migrację Angular 19 → 20 → 21 → 22 sprawdzono lokalnie — [raport etapu 7](docs/ETAP-7-RAPORT.md). Style korzystają z Tailwind 4.3.3 i daisyUI 5.7.50 — [raport etapu 8](docs/ETAP-8-RAPORT.md). Docelowe zmiany są opisane w [planie](docs/PLAN-IMPLEMENTACJI.md), a pomiary i znane problemy w [raporcie etapu 0](docs/ETAP-0-RAPORT.md).

## Uruchomienie lokalne

Sprawdzony Node: 22.23.2, przypięty w `.nvmrc`. Konfiguracja Functions i emulator używają Node 22. Runtime Node 22 jest wdrożony na produkcji — zobacz [raport etapu 1](docs/ETAP-1-RAPORT.md).

```sh
npm ci
npm --prefix functions ci
```

Terminal 1 — backend i emulator Hosting:

```sh
npm run emulators
```

Terminal 2 — frontend z lokalnym backendem:

```sh
npm start
```

- Aplikacja: http://localhost:4300/calculators/treasury-bonds
- Functions: http://127.0.0.1:5001/personal-finance-2ee61/us-central1
- Panel emulatorów: http://127.0.0.1:4000
- Hosting: http://127.0.0.1:5050 — serwuje istniejący katalog `dist`, z API wybranym przy jego budowaniu. Przed pierwszym uruchomieniem Hosting wykonaj `npm run build`. Port 5000 jest zajęty przez usługę macOS.

Po zmianach źródeł Functions wykonaj `npm run build:functions`; emulator obserwuje skompilowane pliki. Nie ma potrzeby wdrażania kodu do Firebase, żeby testować kalkulatory.

Domyślny port frontendu to 4300; port 4200 pozostaje dostępny dla innych projektów. Emulator Functions dopuszcza origin `http://localhost:4300`. Produkcyjny CORS pozostaje bez zmian.

## Środowiska i build

| Komenda | Backend |
| --- | --- |
| `npm start` | Lokalny emulator |
| `npm run start:production` | Produkcyjne API, frontend w trybie developerskim |
| `npm run build` | Produkcyjne API, zoptymalizowany build z prerenderem |
| `npm run build:local` | Emulator, build developerski; wymaga działającego emulatora do prerenderingu |
| `npm run start:staging` / `npm run build:staging` | Jawnie wskazany backend staging |

Staging wymaga zmiennej `OSZCZEDZIFY_STAGING_FUNCTIONS_BASE_URL`, np. bazowego adresu `https://us-central1-TWOJ-PROJEKT-STAGING.cloudfunctions.net`. Nie jest to zmienna z tokenem. Bez niej polecenie kończy się błędem; nie używa produkcji zastępczo. Backend staging musi udostępniać te same cztery endpointy. Nowego projektu staging nie utworzono.

Wspólne URL produkcyjne: `src/app/core/http/api-endpoints.ts`. Lokalne: `src/environments/environment.local.ts`. Konfiguracja staging jest generowana do ignorowanego pliku. Nie należy jej edytować ręcznie.

## Struktura aplikacji

```text
src/app/
  core/          # HTTP i SEO
  features/      # kalkulatory, artykuły, informacje, strona główna i 404
  layout/        # nagłówek, stopka i nawigacja
  shared/        # wspólne UI, formularze i narzędzia
src/environments/
public/
functions/       # osobny backend, własny package.json i lockfile
```

`angular.json` definiuje jeden projekt `personal-finance` z builderami `@angular/build`. Skrypt `scripts/workspace.mjs` przygotowuje SEO i metadane wersji, a następnie uruchamia lokalne `ng serve` lub `ng build`. `npm test` uruchamia Vitest przez Angular CLI (`ng test --watch=false`), w trybie zoneless. Wynik produkcyjny do Firebase Hosting: `dist/oszczedzify/browser`. Aliasy TypeScript to `@core/*`, `@features/*`, `@layout/*`, `@shared/*` i `@data/bond-offer`; testy korzystają z tej samej mapy. Tailwind 4 korzysta z pluginu `@tailwindcss/postcss` w `.postcssrc.json`. Konfiguracja CSS-first, motyw `pf` i jawne skanowanie `src/app` (bez testów) są w `src/styles.css`; wspólne style interakcji w `src/ui.css`. Pipeline stylów aplikacji używa CSS bez Sass.

## Sprawdzenia

```sh
npm test
npm run lint
npm run test:functions
npm run build
npm run smoke:api
npm run smoke:api -- --contracts --compare-production
```

Ostatnia komenda wysyła stałe, przykładowe dane do emulatora i produkcji, porównuje JSON czterech endpointów oraz sprawdza CORS i lokalny identyfikator buildu. `npm run smoke:api -- --production` sprawdza wyłącznie produkcję. Sprawdzenie obejmuje kontrakty HTTP; testy zgodności obligacji z ofertą są opisane w [raporcie etapu 2](docs/ETAP-2-RAPORT.md).

`npm --prefix functions run lint` analizuje `src` poprawną konfiguracją flat config. Po czystej instalacji zależności przechodzi bez błędów i ostrzeżeń. Opcja `--contracts` w smoke sprawdza dodatkowo HTTP 400 dla błędnych żądań i HTTP 204 dla preflight CORS.

## Identyfikacja wydania

`npm start` i polecenia build generują metadane w `/version.json`. Lokalna komenda `npm run build:functions` oraz hook predeploy generują `functions/lib/version.json`, a odpowiedzi HTTP mają nagłówek `X-Oszczedzify-Build`. Oznaczenia obejmują SHA Git, dirty, czas, cel API i hash konfiguracji obligacji. Wersja oferty pochodzi ze wspólnego pliku `functions/src/treasury-bonds/treasury-bonds.offer.json`.

Metadane odświeżają się przy uruchomieniu polecenia, nie przy każdym HMR. Pliki generowane nie trafiają do Git. Przy publikowaniu zmian z `dirty: true` trzeba osobno zachować dokładny patch/źródła wydania.

## Wdrożenie po przeglądzie

Projekt produkcyjny: `personal-finance-2ee61`. Etapy 5–8 wdrożono do Hostingu 22.10.2026 z commita `e7e104e` — [kontrola produkcji](docs/ETAP-8-WDROZENIE.md). Frontend produkcyjny korzysta z Angulara 22, Signal Forms, zoneless, Tailwinda 4 i daisyUI 5. Publikacja produkcyjna, commit i push wymagają osobnego polecenia użytkownika.

`npm run deploy` wykonuje świeży build produkcyjny i wdraża tylko Hosting. Po osobnym poleceniu użytkownika `npm run deploy:functions` wdraża wyłącznie Functions na Node 22. Hooki predeploy sprawdzają lint, budują backend i generują metadane. Po publikacji uruchom `npm run smoke:api -- --production --contracts` oraz sprawdź runtime i logi Functions.

Preview Hosting nie tworzy backendu staging. Obecny CORS Functions dopuszcza localhost i domeny produkcyjne; nowy adres preview wymaga jawnej konfiguracji dozwolonego originu albo osobnego backendu staging. Podgląd techniczny można w tym czasie wykonywać lokalnie.

Przed publikacją zapisz bieżący release Hosting, kod i konfigurację Functions oraz identyfikatory buildów. Hosting można przywrócić do poprzedniego wydania. Powrót Functions polega na ponownym wdrożeniu zachowanego kodu na wspieranym runtime.
