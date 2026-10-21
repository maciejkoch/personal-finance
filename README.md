# Oszczędzify

Kalkulatory finansowe w Angular 19 / Nx oraz backend Firebase Functions. Docelowe zmiany są opisane w [planie](docs/PLAN-IMPLEMENTACJI.md), a pomiary i znane problemy w [raporcie etapu 0](docs/ETAP-0-RAPORT.md).

## Uruchomienie lokalne

Sprawdzony Node: 22.23.2, przypięty w `.nvmrc`. Konfiguracja Functions i emulator używają Node 22. Wdrożenie runtime Node 22 na produkcję wymaga osobnego polecenia — zobacz [raport etapu 1](docs/ETAP-1-RAPORT.md).

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
npm start -- --host localhost --port 4200
```

- Aplikacja: http://localhost:4200/calculators/treasury-bonds
- Functions: http://127.0.0.1:5001/personal-finance-2ee61/us-central1
- Panel emulatorów: http://127.0.0.1:4000
- Hosting: http://127.0.0.1:5050 — serwuje istniejący katalog `dist`, z API wybranym przy jego budowaniu. Przed pierwszym uruchomieniem Hosting wykonaj `npm run build`. Port 5000 jest zajęty przez usługę macOS.

Po zmianach źródeł Functions wykonaj `npm run build:functions`; emulator obserwuje skompilowane pliki. Nie ma potrzeby wdrażania kodu do Firebase, żeby testować kalkulatory.

## Środowiska i build

| Komenda | Backend |
| --- | --- |
| `npm start` | Lokalny emulator |
| `npm run start:production` | Produkcyjne API, frontend w trybie developerskim |
| `npm run build` | Produkcyjne API, zoptymalizowany build z prerenderem |
| `npm run build:local` | Emulator, build developerski; wymaga działającego emulatora do prerenderingu |
| `npm run start:staging` / `npm run build:staging` | Jawnie wskazany backend staging |

Staging wymaga zmiennej `OSZCZEDZIFY_STAGING_FUNCTIONS_BASE_URL`, np. bazowego adresu `https://us-central1-TWOJ-PROJEKT-STAGING.cloudfunctions.net`. Nie jest to zmienna z tokenem. Bez niej polecenie kończy się błędem; nie używa produkcji zastępczo. Backend staging musi udostępniać te same cztery endpointy. Nowego projektu staging nie utworzono.

Wspólne URL produkcyjne: `libs/shared/src/lib/http/api-endpoints.ts`. Lokalne: `apps/personal-finance/src/environments/environment.local.ts`. Konfiguracja staging jest generowana do ignorowanego pliku. Nie należy jej edytować ręcznie.

## Sprawdzenia

```sh
npm test
npm run test:functions
npm run build
npm run smoke:api
npm run smoke:api -- --contracts --compare-production
```

Ostatnia komenda wysyła stałe, przykładowe dane do emulatora i produkcji, porównuje JSON czterech endpointów oraz sprawdza CORS i lokalny identyfikator buildu. `npm run smoke:api -- --production` sprawdza wyłącznie produkcję. To sprawdzenia zachowania istniejącej wersji; zgodność finansowa z nową ofertą wymaga osobnego etapu.

`npm --prefix functions run lint` analizuje `src` poprawną konfiguracją flat config. Przechodzi z 33 ostrzeżeniami o istniejących asercjach non-null; brak błędów. Opcja `--contracts` w smoke sprawdza dodatkowo HTTP 400 dla błędnych żądań i HTTP 204 dla preflight CORS.

## Identyfikacja wydania

`npm start` i polecenia build generują metadane w `/version.json`. Lokalna komenda `npm run build:functions` oraz hook predeploy generują `functions/lib/version.json`, a odpowiedzi HTTP mają nagłówek `X-Oszczedzify-Build`. Oznaczenia obejmują SHA Git, dirty, czas, cel API i hash konfiguracji obligacji. `legacy-unversioned` oznacza, że danych oferty nie zaktualizowano jeszcze do nowej emisji.

Metadane odświeżają się przy uruchomieniu polecenia, nie przy każdym HMR. Pliki generowane nie trafiają do Git. Przy publikowaniu zmian z `dirty: true` trzeba osobno zachować dokładny patch/źródła wydania.

## Wdrożenie po przeglądzie

Projekt produkcyjny: `personal-finance-2ee61`. W tym etapie nie wykonano wdrożenia. Publikacja produkcyjna, commit i push wymagają osobnego polecenia użytkownika.

`npm run deploy` wykonuje świeży build produkcyjny i wdraża tylko Hosting. Po osobnym poleceniu użytkownika `npm run deploy:functions` wdraża wyłącznie Functions na Node 22. Hooki predeploy sprawdzają lint, budują backend i generują metadane. Po publikacji uruchom `npm run smoke:api -- --production --contracts` oraz sprawdź runtime i logi Functions.

Preview Hosting nie tworzy backendu staging. Obecny CORS Functions dopuszcza localhost i domeny produkcyjne; nowy adres preview wymaga jawnej konfiguracji dozwolonego originu albo osobnego backendu staging. Podgląd techniczny można w tym czasie wykonywać lokalnie.

Przed publikacją zapisz bieżący release Hosting, kod i konfigurację Functions oraz identyfikatory buildów. Hosting można przywrócić do poprzedniego wydania. Powrót Functions polega na ponownym wdrożeniu zachowanego kodu na wspieranym runtime.
