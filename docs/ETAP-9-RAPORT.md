# Etap 9 — SDK, walidacja i pozostałe zależności

Stan: 22.10.2026. Podetapy 9a–9c wykonano łącznie na polecenie użytkownika. Po poprawce kontrastu menu mobilnego wykonano commit `be222d7`, push na `main` oraz publikację Functions i Hostingu. Uwzględniono wcześniej opublikowany commit identyfikacji wizualnej `1860192`. [Kontrola produkcji](ETAP-9-WDROZENIE.md) przeszła pomyślnie.

## Wersje i porządki

| Obszar                                   | Przed (lockfile)         | Po                      |
| ---------------------------------------- | ------------------------ | ----------------------- |
| Firebase Functions SDK                   | 6.1.0                    | 7.4.0                   |
| Firebase Admin SDK                       | 12.7.0                   | 14.5.0                  |
| Zod — frontend i Functions               | 3.23.8                   | 4.6.7                   |
| Marked                                   | 14.1.3                   | 18.1.1                  |
| Chart.js                                 | 4.4.6                    | 4.6.1                   |
| RxJS                                     | 7.8.2 z zakresu `~7.8.0` | jawne 7.8.2             |
| Lodash i typy                            | 4.17.21                  | usunięte                |
| Mocha                                    | 10.8.2                   | 12.0.3                  |
| TypeScript Functions                     | 5.6.3                    | 6.0.3                   |
| ESLint — frontend / Functions            | 9.15.0 / 8.57.1          | 10.13.0                 |
| TypeScript ESLint — frontend / Functions | 8.72.0 / 5.62.0          | 8.72.0                  |
| Prettier / eslint-config-prettier        | 3.3.3 / 9.1.0            | 3.9.10 / 10.1.8         |
| Angular build / CLI / SSR                | 22.2.3                   | 22.2.4                  |
| Vite w builderze                         | 8.3.2                    | 8.3.5 (scoped override) |
| Parser selektorów Typography             | 6.0.10                   | 6.1.5 (scoped override) |
| Firebase CLI w skryptach                 | `latest`                 | 15.34.1                 |

Wersje i peer dependencies sprawdzono w rejestrze npm. Angular core pozostaje 22.2.3; poprawki narzędzi 22.2.4 są zgodne z jego peer dependencies. TypeScript 7.0.2 nie mieści się w wymaganiach buildera Angular ani TypeScript ESLint; oba projekty używają 6.0.3. Typy Node 22.20.5 odpowiadają runtime Node 22, lokalnie przypiętemu do 22.23.2.

Usunięto nieużywane `@angular/animations`, `firebase-functions-test`, stare osobne pakiety parsera/pluginu TypeScript ESLint, `eslint-config-google` oraz `eslint-plugin-import`. Backend używa aktualnego pakietu `typescript-eslint` i natywnego flat config; frontend korzysta z `defineConfig` oraz aktualnej konfiguracji Prettier. Usunięcie Lodash zastępuje tylko mapowanie wartości i stabilne sortowanie tabeli standardowym JavaScript. Zachowano kolejność remisów i paletę kolorów.

Admin SDK nie ma importów biznesowych, lecz jest wymaganym peer dependency Functions SDK, a emulator CLI wymaga także bezpośredniej deklaracji w `functions/package.json`. Próba usunięcia deklaracji została odrzucona przez emulator. Pozostawiono aktualne 14.5.0 jako zależność operacyjną. Frontend nadal korzysta z HTTP bez Firebase SDK.

## HTTP, Zod 4 i zapis ustawień

- Typ odpowiedzi HTTP pochodzi z sygnatury `HttpsFunction`; usunięto bezpośrednie importy typów Express 4. Nowy SDK używa Express 5. Test emulatora obejmuje również rzeczywisty parser query i odrzucanie powtórzonych parametrów.
- Functions kompilują się w trybie `NodeNext`, z jawnym `rootDir` i targetem ES2022. Wynik pozostaje CommonJS. Marked 18 jako ESM jest ładowany przez obsługę `require(ESM)` w sprawdzonym Node 22.23.2. `marked.parse(..., { async: false })` zachowuje kontrakt `{ html: string }`.
- Wspólny parser liczb nie zamienia pustych pól ani tablic na zero. `skipTax` zachowuje brak parametru jako `false`, akceptuje dotychczasowe ciągi `true`/`false` i odrzuca inne wartości.
- Naprawiono wcześniejsze błędne trzecie argumenty `z.preprocess` w dwóch kalkulatorach. Okres to pełne lata 1–100, stopy to 0–1 w API (0–100% w UI). Kwota pozostaje dodatnią liczbą. Okres ułamkowy wcześniej kończył się błędem obliczeń; teraz daje HTTP 400 i czytelny komunikat formularza. Granice obligacji pozostają 1–144 miesiące i 1–1 000 000 sztuk.
- Błędy walidacji są jawnie serializowane jako `{ name: "ZodError", issues: [...] }`, niezależnie od serializacji obiektu Error w Zod 4. Każdy element ma ścieżkę, kod i komunikat. Szczegółowe kody oraz teksty są właściwe dla Zod 4; nie obiecujemy ich identyczności z Zod 3. Poprawne odpowiedzi i nazwy endpointów zachowują dotychczasową postać.
- Slugi artykułów dopuszczają małe litery ASCII, cyfry i pojedyncze łączniki, do 120 znaków. Oba istniejące adresy działają; niepoprawne slugi i próby wyjścia poza katalog treści dają 400, poprawny nieistniejący slug daje 404.
- Klucze i format localStorage pozostają zgodne: płaskie obiekty dwóch kalkulatorów, boolean wyróżniania wyników oraz koperta obligacji `schemaVersion: 2`. Istniejąca migracja obligacji nadal odczytuje starsze płaskie dane, naprawia pola osobno i zachowuje świadome założenia użytkownika. Zmiana biblioteki nie wymaga nowej wersji formatu.
- Wspólny odczyt localStorage bezpiecznie obsługuje uszkodzony JSON, niezgodne typy, brak storage podczas SSR i odmowę dostępu przeglądarki. Zapis obsługuje przekroczenie limitu. Nie logujemy zapisanych wartości; początkowy brak preferencji kolorów nie nadpisuje storage wartością `null`.

Rozszerzony test CORS wykrył w emulatorze dodatkową warstwę SDK działającą w debug mode. Jawne `onRequest({ cors: false }, ...)` pozostawia obsługę w dotychczasowym middleware aplikacji: te same originy, exposed build header i preflight 204. Cztery endpointy nie zwracają zgody CORS dla obcego originu. Skala `maxInstances: 100`, runtime, nazwy i region domyślny pozostają bez zmian.

## Weryfikacja

| Sprawdzenie                                                     | Wynik                                                                                  |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Czyste `npm ci --offline --no-audit --no-fund` w obu projektach | OK                                                                                     |
| `npm ls --all` w obu projektach                                 | bez błędów i konfliktów peer dependencies                                              |
| `npm test`                                                      | 35 testów, 11 zestawów                                                                 |
| `npm run test:functions`                                        | 44 testy, w tym dotychczasowe 36 testów domeny i kontraktów obligacji                  |
| `npm run lint`, `npm run lint:functions`                        | OK                                                                                     |
| `npx tsc -p tsconfig.spec.json --noEmit`                        | OK                                                                                     |
| `npm run build:functions`                                       | OK, metadane wersji                                                                    |
| Produkcyjny `npm run build`                                     | 8 prerenderowanych tras i finalizacja 404, bez ostrzeżenia CommonJS Lodash             |
| `smoke:api -- --contracts --compare-production`                 | cztery odpowiedzi identyczne z produkcją; walidacja, format błędów i CORS OK           |
| `smoke:bonds`                                                   | przykłady wykupu, podatek, 6 błędnych żądań i CORS OK                                  |
| `smoke:hosting` na 5050                                         | siedem stron, metadane, canonicale, JSON-LD, 301, rzeczywiste 404, robots i sitemap OK |
| Porównanie z lokalną bazą sprzed aktualizacji                   | trzy przykładowe JSON kalkulatorów i pełny HTML obu artykułów identyczne               |
| CSS przed i po poprawce parsera selektorów                      | identyczny bajtowo                                                                     |
| `git diff --check`                                              | OK                                                                                     |

Testy obejmują granice zakresów, ułamkowe lata, puste wartości, nieprawidłowe tablice/obiekty, nieskończoności, flagi podatku, starsze zapisy i niedostępny localStorage. Instalacja, Angular/Vitest, prerender i emulatory wymagały uruchomienia poza ograniczonym sandboxem. Zachowano lokalną politykę blokowania install scripts; kompilacja i testy działają bez ich odblokowywania. npm nadal zgłasza deprecjacje niektórych przechodnich narzędzi Functions.

W przeglądarce sprawdzono zachowane ustawienia wszystkich kalkulatorów: cel 10 000 zł / 2 lata / inflacja 3% / stopa 5% daje 425,03 zł miesięcznie; pominięcie obu stóp daje 416,67 zł. Składka 500 zł / 2 lata / 5% daje 12 480,30 zł, zmiana do 600 zł daje 14 976,36 zł i aktualizuje wykres. Obligacje 10 sztuk / 2 lata pokazują ROD 1072,41 zł w tabeli; działa wyróżnianie wyników po usunięciu Lodash. Sprawdzono wykres słupkowy oraz linie obligacji, także w widoku 390 px bez poszerzania dokumentu. Artykuł zachowuje nagłówki, listy i treść. Konsola sprawdzonej sesji nie zawiera błędów.

Wspólny workspace zawiera równoległe zmiany identyfikacji wizualnej i SEO. Pozostawiono je nienaruszone; nie należą do zakresu tego raportu. Build i kontrola przeglądarkowa sprawdzają faktyczny wspólny stan plików, dlatego porównanie całkowitej wagi lub wyglądu z etapem 8 nie izoluje wpływu etapu 9. Końcowy początkowy zestaw JS/CSS ma 456,74 kB, poniżej budżetu 500 kB. Wszystkie 47 statycznych zasobów JS/CSS/obrazów/ikon/manifestu zwraca HTTP 200 i jest identyczne bajtowo z buildem. Świeży dev server na porcie 4301 z Vite 8.3.5 zwraca prawidłowy HTML i trzy przekształcone skrypty; proces testowy i własne emulatory zatrzymano po odbiorze.

## Audyt i wyjątki zgodności

`npm audit --omit=dev` daje **0 zgłoszeń** dla frontendu i Functions. Pełny audyt Functions również daje **0**. Pełny audyt frontendu nadal zwraca **2 moderate**: parser selektorów CSS i korzystający z niego Tailwind Typography. Nie ma zgłoszeń high ani critical.

Wersję parsera podniesiono z 6.0.10 do **6.1.5** w override ograniczonym do Typography, bez wymuszania nowego majora. [Oficjalny advisory autora](https://github.com/postcss/postcss-selector-parser/security/advisories/GHSA-rj75-hqrm-r3gf) wymienia 6.1.5 jako naprawioną wersję gałęzi 6.x, ale metadane npm audit nadal opisują zakres jako `<7.1.6`. Jest to rozbieżność źródeł, a nie pominięcie poprawki. Parser działa wyłącznie przy budowie z zaufanych plików repozytorium. Usunięcie override: po wydaniu Typography zależącego od poprawionej wersji parsera; ponowić audyt po korekcie jego metadanych. Nie tłumimy wyjścia `npm audit` ani kodu błędu.

Vite 8.3.5 jest osobnym override ograniczonym do Angular build 22.2.4, który deklaruje starszą dokładną wersję. To poprawka w tej samej linii minor; sprawdzono testy, build i dev server aplikacji. Usunięcie override: gdy aktualny zgodny builder sam zależy od Vite co najmniej 8.3.3 lub nowszej bez zgłoszeń audytu. Nie używano `audit fix --force`, `--force` ani `--legacy-peer-deps`.

Skrót maszynowy wyników i wersji: [kontrola etapu 9](baseline/2026-10-22-stage9-checks.json).

## Poprawka menu mobilnego po odbiorze

Na zgłoszenie użytkownika usunięto pomarańczowe tło aktywnego linku. daisyUI 5 styluje automatycznie `aria-current`; lokalna klasa menu ustawia jego `--menu-active-bg` na delikatne jasne wyróżnienie na ciemnym tle oraz `--menu-active-fg` na niebieski kolor secondary. Sprawdzono aktywny kalkulator i „O nas” przy szerokości 390 px oraz nawigację Enter. Użytkownik polecił commit, push i publikację całości.

## Publikacja po przeglądzie — wykonana

1. Po osobnym poleceniu użytkownika przejrzano całość zmian i połączono je z aktualnym `origin/main`. Commit źródeł: `be222d7`; push wykonano.
2. Opublikowano kompatybilne Functions, sprawdzono cztery endpointy, identyfikator buildu i logi. Szczegóły ostrzeżenia o polityce sprzątania obrazów zapisano w raporcie publikacji.
3. Opublikowano dokładnie lokalnie sprawdzony Hosting, bez ponownego buildu. Weryfikacja `version.json`, menu mobilnego, zasobów, formularzy, artykułów, oferty i SEO oraz produkcyjne smoke API i obligacji przeszły.
4. Następny etap planu: 10 — treść i dalszy wzrost SEO.

Źródła migracji: [Zod 4](https://zod.dev/v4/changelog), [Marked](https://marked.js.org/using_advanced), [ESLint flat config](https://eslint.org/docs/latest/use/configure/migration-guide). Wersje bibliotek i wymagania zgodności pochodzą z metadanych oficjalnego rejestru npm odczytanych 22.10.2026.
