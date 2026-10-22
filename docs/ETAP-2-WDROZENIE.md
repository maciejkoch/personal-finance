# Wdrożenie etapu 2

Data: 22.10.2026. Projekt: `personal-finance-2ee61`. Na polecenie użytkownika wykonano commit, push do `origin/main`, następnie Functions i Hosting. Kod produkcyjny: `caea9b4f0d9715234f028cc8053477540880443b`.

## Wersje

- Oferta `2026-10-v1`, metoda obliczeń `calculationVersion: 2`.
- Functions: `caea9b4-2026-10-22T04:25:10.787Z`, `dirty: false`.
- Frontend: `caea9b4-2026-10-22T04:24:45.742Z`, `dirty: false`, `apiTarget: production`.
- Wspólny hash oferty: `842b6e37a276a66bea362fca39fb13a1af3682af200a7824cbd1a964b232f0a8`.
- Hosting: `8e7258ae16a90985`, release `1792643281685000`, publikacja 22.10.2026 04:28:01.685 UTC (06:28 czasu polskiego). Poprzednia wersja: `7982bf5807b070e8`.

## Publikacja i weryfikacja

1. GitHub potwierdził `caea9b4` na gałęzi main. Produkcyjny build z sześcioma trasami oraz lint/build Functions przeszły. Build frontendu wykonano z `--skip-nx-cache`, ponieważ Nx przywrócił poprzedni plik metadanych z cache. Przed publikacją sprawdzono zgodność SHA i `dirty: false` w obu artefaktach.
2. Opublikowano cztery Functions. Kontrola produkcyjna `smoke:api -- --production --contracts` przeszła: cztery poprawne odpowiedzi, HTTP 400 bez wymaganych parametrów i preflight CORS. `smoke:bonds -- --production` potwierdził przykłady wykupu, pomijanie podatku, wersję oferty i sześć błędnych żądań.
3. Osiem adresów (Cloud Functions i używane przez frontend Cloud Run) odpowiada HTTP 200 z aktualnym nagłówkiem buildu i CORS dla `https://oszczedzify.org`. TLS sprawdzono z włączoną normalną walidacją certyfikatów. Zachowano nazwy i adresy endpointów.
4. Odczyt konfiguracji czterech Functions potwierdził `ACTIVE`, Node 22, us-central1, 256 MiB, 1 CPU, timeout 60 s, współbieżność 80 i maksymalnie 100 instancji.
5. Następnie opublikowano dokładnie sprawdzony artefakt Hostingu. `version.json` na domenie głównej i adresie Firebase jest identyczny z artefaktem lokalnym. Sześć tras zwraca HTTP 200; surowy HTML kalkulatora zawiera miesiąc oferty, ROS1032, ROD1038 i siedem linków do listów emisyjnych.
6. W przeglądarce potwierdzono nową ofertę, wyniki tabeli i wykres, poprawne etykiety ROS/ROD oraz wynik jednej TOS po trzech latach: 111,16 zł z podatkiem i 113,79 zł po jego pominięciu. Przywrócono początkową liczbę obligacji, okres i ustawienie podatku. W badanej sesji brak błędów konsoli.
7. Odczyt logów Functions od 04:25:02.992 UTC nie wykazał wpisów ERROR lub wyższych. To kontrola krótkiego okna po publikacji, nie długoterminowy monitoring.

## Komunikaty narzędzi

Narzędzie Functions zwróciło status `failed` z komunikatem, że funkcje zostały opublikowane, ale nie udało się skonfigurować cleanup policy obrazów w Artifact Registry. To ten sam problem co w etapie 1. Publikację potwierdzono niezależnie konfiguracją i nagłówkami wszystkich endpointów; politykę retencji pozostawiono bez zmian.

Narzędzie MCP Hostingu nie rozpoznało domyślnej witryny (`site name or target name`). Wdrożenie zakończyło się poprawnie przez oficjalne CLI z jawnym projektem, bez zmiany konfiguracji ani ponownego budowania artefaktu.

[Zanonimizowany zapis wersji i kontroli](baseline/2026-10-22-stage2-deploy.json). [Zakres zmian i ograniczenia modelu](ETAP-2-RAPORT.md). Etap 3 nie został rozpoczęty. Nie zmieniano zasad 404 ani SEO w ramach tej publikacji.
