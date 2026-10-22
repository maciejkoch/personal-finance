# Etap 7 — Angular 22, Signal Forms i zoneless

Stan: 22.10.2026. Migrację Angular 19 → 20 → 21 → 22 zakończono i sprawdzono lokalnie. Na prośbę użytkownika kontynuowano do najnowszego stabilnego Angulara bez wdrożeń wersji pośrednich i przeniesiono wszystkie trzy formularze kalkulatorów na Signal Forms. Bazowy commit całego zestawu zmian: `6c07a2e`, po produkcyjnym wdrożeniu etapu 4. Użytkownik zatwierdził commit i push całego zestawu; wdrożenia nie wykonano.

## Docelowy zestaw

| Obszar | Wersja / stan |
| --- | --- |
| Angular, CLI, compiler, SSR i build | 22.2.3, najnowsze stabilne wydanie w npm sprawdzone 22.10.2026 |
| NgRx Signals / Operators | 22.0.1 |
| TypeScript | 6.0.3, zgodny z zakresem Angular 22; TypeScript 7 pozostaje poza wspieranym zakresem |
| Angular ESLint / TypeScript ESLint | 22.6.0 / 8.72.0 |
| Vitest / jsdom | 5.0.5 / 30.1.3 |
| Node lokalny | 22.23.2, bez zmiany `.nvmrc` |
| Detekcja zmian | Domyślny zoneless Angular 22, komponenty OnPush |
| Formularze | Angular Signal Forms, `@angular/forms/signals` |

Wersje i wymagania sprawdzono w rejestrze npm oraz [macierzy zgodności Angular](https://angular.dev/reference/versions). Zastosowano oficjalne migracje core/CLI/SSR i NgRx, kolejno dla każdego majora. Wyniki pośrednie opisują [etap 5](ETAP-5-RAPORT.md) i [etap 6](ETAP-6-RAPORT.md).

## Zmiany

- Usunięto `provideZoneChangeDetection` z konfiguracji aplikacji i serwerowego bootstrapa, polyfill przeglądarki oraz zależność `zone.js`. Lockfile nie zawiera Zone.js. Wykorzystano domyślny tryb zoneless Angular 22 zgodnie z [dokumentacją](https://angular.dev/guide/zoneless).
- Zachowano NgRx SignalStore, signal inputs/outputs i sygnały wyników. Kalkulatory, wykresy Chart.js, asynchroniczne artykuły i nawigacja działają bez Zone.js. Trzy komponenty, którym migrator dodał Eager dla zachowania poprzedniej wartości domyślnej, dostosowano do OnPush; ich stan jest sygnałowy albo statyczny.
- Trzy formularze zastąpiono modelami `signal`, drzewami `form`, dyrektywą `FormField` oraz regułami `required`, `min`, `max`, `validate` i `disabled`. Zachowano zakresy walidacji, całkowite lata i liczbę obligacji, przełączniki, reset obligacji i 300 ms debounce żądań. Puste lub nieprawidłowe pola blokują nowe obliczenia i zapis ustawień.
- Wyłączanie inflacji i stopy zwrotu działa przez reguły formularza. Wartości pozostają w modelu po wyłączeniu pola i wracają po jego ponownym włączeniu. Do API nadal trafia pełen istniejący kontrakt. Zachowano wszystkie klucze i formaty localStorage, w tym schemat v2 obligacji.
- Usunięto Reactive Forms z trzech kalkulatorów, zbędne importy z akordeonów i helper ręcznego włączania kontrolek. Nie zmieniono zasad finansowych ani danych oferty.
- Oficjalna migracja builderów zastąpiła `@angular-devkit/build-angular` przez `@angular/build`. Build, dev-server i extract-i18n używają tej samej aktualnej rodziny builderów. Dodano `@angular/build:unit-test`; `npm test` wykonuje `ng test --watch=false`.
- Przeniesiono wszystkie istniejące testy z Jesta do Vitest, zastępując `fakeAsync`/`tick` oczekiwaniem na stabilizację i asynchroniczne aktualizacje. Dodano pięć przypadków regresji Signal Forms. Usunięto pakiety i konfigurację Jesta oraz nieużywaną po nim `platform-browser-dynamic`. TestBed inicjalizuje builder Angular, w trybie zoneless.
- Końcowy test backendu ujawnił wcześniejszą zależność od globalnych typów Jesta z frontendu. Dodano jedną zależność developerską `@types/mocha` 10.0.10 i jawne `types: ["node", "mocha"]` w konfiguracji Functions. Nie zmieniło to żadnego SDK, kodu wykonawczego ani kontraktu backendu; testy mają teraz własne deklaracje runnera.
- Konfiguracja Angular ESLint 22 korzysta z oficjalnego pakietu `angular-eslint` i jego flat configs. Zachowano prefiksy komponentów/dyrektyw `pf` i `pfui`. Usunięto przestarzałe `baseUrl`; aliasy TypeScript mają jawne ścieżki względne. `strictTemplates` pozostaje włączone.
- Oficjalna migracja zachowała dotychczasowy tryb hydratacji przez `withNoIncrementalHydration()`. Nie włączano osobno incremental hydration. Publiczne URL, prerendering i konfiguracja Firebase Hosting pozostały zgodne z poprzednią wersją.

Signal Forms zastosowano według [oficjalnego przewodnika](https://angular.dev/guide/forms/signals/overview), a Vitest według [konfiguracji Angular CLI](https://angular.dev/guide/testing/migrating-to-vitest). Tailwind 3.4.15 i daisyUI 4.12.14 pozostają do etapu 8. Aktualizacje SDK Functions i pozostałych bibliotek należą do etapu 9.

## Weryfikacja

| Sprawdzenie | Wynik |
| --- | --- |
| `npm ci --offline --no-audit --no-fund` | Czysta instalacja, 558 pakietów na lokalnej platformie |
| `npm ls --all` | Bez nieprawidłowych zależności i konfliktów peer dependencies |
| `npm test` po czystej instalacji | 28 testów w 10 zestawach, Vitest 5.0.5 |
| `npm run lint` | Bez błędów i ostrzeżeń |
| `tsc -p tsconfig.spec.json --noEmit` | OK |
| `npm run test:functions` | 36 testów, OK |
| Czysta instalacja i kontrola Functions | `npm ci` i `npm ls --all` OK; lint bez błędów i ostrzeżeń |
| Build produkcyjny po czystej instalacji | 8 prerenderowanych tras, poprawna finalizacja 404 |
| `npm start` | Angular 22 na porcie 4300, API lokalnego emulatora |
| Smoke Hostingu na porcie 5050 | Siedem stron 200, przekierowania 301, rzeczywiste 404, robots, sitemap, canonicale i JSON-LD |
| Zasoby Hostingu | 35 plików JS/CSS/obrazów/ikon: HTTP 200 i zgodność bajtów z artefaktem |
| Preview | Wszystkie dokumenty preview mają `noindex, follow`; produkcyjny HTML zachowuje `index, follow` |
| `smoke:api -- --contracts --compare-production` | Cztery endpointy zgodne z produkcją, walidacja i CORS OK |
| Lockfile i źródła | Brak Zone.js, Jesta i użyć Reactive Forms w frontendzie |
| `git diff --check` | OK |

Build i testy CLI wykonano poza ograniczonym sandboxem. Pozostało wcześniejsze ostrzeżenie CommonJS Lodash; jego wymiana lub aktualizacja należy do etapu 9c.

### Regresja HTML i rozmiar

Porównano wszystkie osiem dokumentów z bazowym buildem Angular 19: treść, struktura i metadane, łącznie z JSON-LD, pozostały zgodne. Pominięto wewnętrzne atrybuty Angulara, komentarze, skrypty wykonawcze, style, odwołania do bundli i techniczny znacznik `data-beasties-container` narzędzia CSS. CSS jest identyczny z artefaktem Angular 20; formularze po hydratacji sprawdzono osobno.

Początkowe bundle mają 428,37 kB, wobec 444,60 kB na pośrednim Angular 21 i 424,10 kB na bazowym Angular 19. Pozostają poniżej istniejącego progu 500 kB. Oddzielny bundle polyfilli Zone.js nie jest już generowany.

### Przeglądarka i dostępność

- Bezpośrednie wejście na kalkulator celu: Angular 22.2.3 potwierdził hydratację 9 komponentów i 130 węzłów, 0 pominiętych komponentów. Brak błędów konsoli i hydratacji. Informacja NG0751 opisuje zwykłe eager loading `@defer` w developerskim HMR.
- Zachowano zapisane podczas etapu 5 ustawienia. Cel 10 000 zł / 2 lata / inflacja 3% / stopa 5% nadal daje 425,03 zł miesięcznie. Po pominięciu inflacji i stopy wynik zmienia się na 416,67 zł; odpowiednie pola są wyłączane. Ponowne włączenie przywraca poprzednie założenia i wynik. Odświeżenie zachowuje wartości.
- Regularne wpłaty 500 zł / 2 lata / 5% nadal dają 12 480,30 zł po podatku. Pominięcie stopy zwrotu aktualizuje wynik do 12 000 zł i wyłącza pola stopy oraz podatku, bez utraty wartości 5%.
- Obligacje 10 sztuk / 2 lata nadal dają maksymalnie 1072,41 zł dla ROD. Okres 1,5 roku pokazuje błąd i blokuje nowe obliczenie. Pominięcie podatku przelicza tabelę i wykres (ROD 1089,40 zł); ponowne włączenie podatku przywraca 1072,41 zł.
- Puste pole celu pokazuje komunikat `role="alert"` i blokuje nowe żądanie; uzupełnienie pola przywraca prawidłowy stan. Formularze zachowują etykiety, kontrolki natywne i sygnalizowanie błędów.
- Nawigacja klienta między kalkulatorami, stroną główną i artykułem działa, aktualizując tytuł. Artykuł ładuje treść asynchroniczną w OnPush i zoneless.
- Widok 390 × 844: brak poziomego przewijania, czytelny formularz i wynik, wykres zmienia rozmiar. Mobilne menu otwiera kalkulatory. Sprawdzono także standardowy widok przeglądarki.

Formularze i API kontrolowano przez port 4300 z lokalnymi Functions. Produkcyjny artefakt HTML i zasoby kontrolowano osobno przez emulator Hostingu na porcie 5050. Nie zmieniano listy produkcyjnego CORS.

## Dalszy stan

Aktualizacja samego Angulara do najnowszego stabilnego wydania, migracja trzech formularzy na Signal Forms i przejście na zoneless są zakończone lokalnie. Użytkownik zatwierdził commit i push. Wdrożenie wyłącznie Hostingu z kontrolą produkcji wymaga osobnego polecenia. Produkcyjne zależności, kod wykonawczy i kontrakty Functions nie zostały zmienione; dodano wyłącznie własne typy runnera testowego i ich konfigurację.

Kolejne zakresy modernizacji z planu to Tailwind 4 + daisyUI 5 (etap 8), aktualizacje SDK i pozostałych bibliotek (etap 9), a następnie prace nad treścią i dalszym SEO (etap 10).
