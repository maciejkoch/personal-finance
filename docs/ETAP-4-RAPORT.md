# Etap 4 — jedna aplikacja Angular CLI, bez Nx

Stan: 22.10.2026. Etap 4 wdrożono z commita `d7d8e90`; [kontrola produkcji](ETAP-4-WDROZENIE.md). Implementacja i testy odbiorcze zakończone. Bazowy commit: `7e9b943`.

## Zmiany

- Kod `apps/personal-finance/src` i siedmiu bibliotek przeniesiono do jednej aplikacji: `src/app/features`, `core`, `shared` i `layout`. Kalkulatory, artykuły i pozostałe strony zachowują lazy loading. Nawigacja należy teraz do layoutu, wspólne komponenty UI do `shared/ui`, a HTTP i SEO do `core`.
- `angular.json` definiuje jeden projekt `personal-finance`. Zachowano builder `@angular-devkit/build-angular:application` w wersji 19.0.0, konfiguracje API local/production/staging, prerendering ośmiu tras, budżety i optymalizację produkcyjną. Jest nadal uruchamia te same dziewięć zestawów testów; nie migrowano runnera.
- `scripts/workspace.mjs` przygotowuje metadane i SEO, następnie uruchamia lokalne Angular CLI zamiast Nx. Dotychczasowe komendy `npm start`, `start:production`, `start:staging`, `build`, `build:local` i `build:staging` pozostają dostępne. `npm test` uruchamia Jest bezpośrednio. Dodano `npm run lint` z niezależną konfiguracją ESLint.
- Aliasy TypeScript wskazują foldery aplikacji: `@core/*`, `@features/*`, `@layout/*`, `@shared/*`. Wspólna konfiguracja obligacji nadal pochodzi z backendowego JSON przez `@data/bond-offer`. Jest korzysta z tej samej mapy aliasów.
- Zasoby publiczne są w `public`, lista tras w `routes.txt`, a rejestr stron w `src/app/core/seo/pages.json`. Zaktualizowano skrypty sitemap, finalizacji HTML, smoke i przygotowania preview. Firebase Hosting publikuje `dist/oszczedzify/browser`.
- Usunięto Nx Cloud, wszystkie zależności Nx, konfiguracje projektów i generatorów, presety Nx dla Jest/ESLint, zależności SWC oraz integrację edytora z Nx. Tailwind 3 skanuje bezpośrednio `src`, bez `createGlobPatternsForDependencies`.
- Usunięto niewykorzystywany serwer Express frontendu: dotychczasowy build miał `ssr: false`, a Hosting publikował wyłącznie statyczny katalog przeglądarki. Bootstrap serwerowy do prerenderingu pozostaje. Usunięto bezpośrednie zależności Express i jego typów; pakiety wymagane wewnętrznie przez narzędzia budowania pozostają w lockfile.
- Konfiguracja ESLint korzysta bezpośrednio z istniejących pluginów Angular ESLint 18.4.1, bez zbędnego pakietu zbiorczego, buildera i schematów. Zachowano prefiksy komponentów `pf` oraz `pfui`. Drobne poprawki lint ograniczono do typu argumentu parsera localStorage, pustego `catch` i nazwy pomocniczego komponentu testowego. Inicjalizacja Jest używa `setupZoneTestEnv` z już zainstalowanego presetu.

Angular 19.0.0, NgRx 19.0.0, TypeScript 5.5.4, Tailwind 3.4.15, daisyUI 4.12.14 i Jest 29.7.0 zachowano. Porównanie lockfile nie wykazało zmiany wersji pakietów pozostających w tych samych lokalizacjach. Liczba wpisów pakietów zmniejszyła się z 1787 do 1324, uwzględniając warianty platformowe i zależności opcjonalne. Kod obliczeń i produkcyjne zachowanie Functions pozostały bez zmian. Na późniejsze polecenie użytkownika przeniesiono lokalny frontend na port 4300; w `functions/src/index.ts` dopuszczono ten origin wyłącznie przy `FUNCTIONS_EMULATOR=true`. Nie wymaga to wdrożenia backendu.

## Weryfikacja

| Sprawdzenie | Wynik |
| --- | --- |
| Czysta instalacja końcowego lockfile: `npm ci --offline --no-audit --no-fund` | OK, po wcześniejszym pobraniu brakujących archiwów przez zwykłe `npm ci` |
| `npm ls --all` | OK, bez nieprawidłowych zależności i konfliktów peer dependencies |
| `npm test` | 23 testy w 9 zestawach, tyle samo co przed migracją |
| `npm run lint` | OK, bez błędów i ostrzeżeń |
| `npm run test:functions` | 36 testów, OK |
| `env -u NODE_TLS_REJECT_UNAUTHORIZED NG_BUILD_MAX_WORKERS=2 npm run build` | OK, 8 prerenderowanych tras i finalizacja dokumentu 404 |
| `npm start` | OK, Angular CLI na `http://localhost:4300` i lokalne API emulatora; preflight czterech endpointów dopuszcza nowy origin |
| `node scripts/smoke-hosting.mjs http://127.0.0.1:5050` | 7 stron 200, przekierowania 301, brakujące strony 404, robots, sitemap, canonicale i JSON-LD |
| `npm run preview:prepare` i smoke na osobnym emulatorze z `--preview` | OK, meta oraz nagłówek `noindex, follow`; produkcyjny HTML zachowuje `index, follow` |
| `npm run smoke:api -- --contracts --compare-production` | Wszystkie 4 endpointy: lokalny JSON zgodny z produkcją, walidacja i CORS OK |
| Zasoby na emulatorze Hostingu | 42 pliki JS/CSS/obrazów/ikon: HTTP 200 i bajty zgodne z artefaktem |
| Błędna konfiguracja staging | Brak URL, produkcyjny backend i URL HTTP odrzucone przed uruchomieniem CLI |
| `git diff --check` | OK |

Build w ograniczonym sandboxie kończył się bez użytecznej diagnostyki; bazowy i końcowy build wykonano poza nim. Pozostały wcześniejsze ostrzeżenia o CommonJS Lodash i selektorach daisyUI `.tooltip:has()`. Ich aktualizacja należy do dalszych etapów.

### Porównanie z wersją przed migracją

Przed zmianami zbudowano bazową wersję z Nx. Porównano wszystkie osiem wynikowych dokumentów HTML: widoczny DOM, treść i metadane są identyczne po pominięciu wewnętrznych identyfikatorów Angulara, komentarzy, skryptów i linków do bundli. JSON-LD pozostał w porównaniu. Wynikowy CSS jest identyczny bajt po bajcie: 76 932 bajty.

Porównanie przeniesionych źródeł potwierdziło, że zmiany 67 plików TypeScript ograniczają się do importów, ścieżek i opisanych poprawek lint; osobno zmieniono konfigurację środowiska testowego. Czterdzieści przeniesionych szablonów, plików danych i zasobów oraz globalne style UI zachowały identyczną zawartość.

### Przeglądarka

- Trzy kalkulatory pobierają dane z emulatora, przeliczają formularze i pokazują wyniki oraz wykresy. Przykładowe scenariusze: 10 obligacji / 2 lata, 500 zł miesięcznie / 2 lata / 5%, cel 10 000 zł / 2 lata / inflacja 3% / stopa 5%.
- Dla tych scenariuszy UI pokazał odpowiednio maksymalną wartość obligacji ROD 1072,41 zł, kapitał po podatku przy regularnych wpłatach 12 480,30 zł oraz wymaganą miesięczną wpłatę 425,03 zł dla celu. To kontrola zachowania istniejącego kodu, nie zmiana zasad obliczeń.
- Zapis założeń celu przetrwał odświeżenie, a zapis obligacji ponowną nawigację do kalkulatora.
- Nawigacja ze strony głównej otwiera kalkulator i artykuł, aktualizując tytuł, canonical oraz JSON-LD. Na lokalnym hoście zachowuje `noindex`. Strona „O nas” ładuje się poprawnie.
- Widok mobilny 390 × 844: strona główna bez poziomego przewijania, poprawny układ i działający link do kalkulatora.
- Bezpośrednie wejście na brakujący adres na emulatorze Hostingu zachowuje widok 404 po uruchomieniu Angulara. Kontrola konsoli nie wykazała błędów.

## Przegląd i publikacja

Na polecenie użytkownika wykonano commit, push na `main` i wdrożenie wyłącznie Hostingu. Zmiana listy CORS backendu dotyczy wyłącznie emulatora; Functions nie były wdrażane. Kontrola produkcyjnego HTTP/SEO, zasobów, API i formularza obligacji przeszła. Identyfikatory wydania i poprzedniej wersji zapisano w [raporcie wdrożenia](ETAP-4-WDROZENIE.md) i [pliku bazowym](baseline/2026-10-22-stage4-deploy.json).

Konfigurację workspace zweryfikowano ze schematem zainstalowanego Angular CLI 19 i [oficjalną dokumentacją Angular](https://angular.dev/reference/configs/workspace-config).
