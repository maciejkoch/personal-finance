# Etap 1 — runtime Functions i lint

Data: 21.10.2026. Baza: commit etapu 0 `3aaf765`. Implementacja `5e72874` i poprawka limitu instancji `6d4b0c3` zostały wypchnięte na `origin/main`. Wersja `6d4b0c3` działa na produkcji; kontrola po wdrożeniu przeszła.

## Zmiany

- `functions/package.json` i lockfile deklarują Node 22 zamiast 20. Lokalny Node 22.23.2 jest już przypięty w `.nvmrc`.
- Poprawiono `eslint.config.js` do prawidłowego flat config: obiekty parsera i pluginów, `languageOptions`, reguły rekomendowane JS/TypeScript/import oraz globals Node i Mocha.
- `@eslint/js` 8.57.1 i `globals` 13.24.0 zadeklarowano bezpośrednio jako narzędzia używane przez config. Te wersje już występowały w lockfile; nie zaktualizowano pakietów runtime ani SDK Firebase.
- Reguły formatowania `quotes` i `indent`, których poprzednia konfiguracja nie potrafiła uruchomić, nie są częścią bramki deploya. Formatowanie pozostaje do uporządkowania w etapie narzędziowym. Zalecane reguły wykrywające błędy i kontrola nieużywanych zmiennych działają.
- Usunięto jeden nieużywany parametr `month` z callbacka oprocentowania TOS. Funkcja nadal zwraca dokładnie `treasuryBonds.firstPeriodRate`; stawki i obliczenia pozostają bez zmiany.
- Dodano rootową komendę `npm run deploy:functions`, kierującą wyłącznie do Functions projektu `personal-finance-2ee61`. Komendy backendu również korzystają z oficjalnego CLI przez npx i jawnego projektu.
- Jawnie ustawiono `maxInstances: 100` dla czterech Functions, zachowując wartość odczytaną z produkcji przed wdrożeniem. Pierwszy deploy bez tego ustawienia zmienił limit na 20.
- `smoke:api -- --contracts` dodatkowo sprawdza HTTP 400 dla żądania bez parametrów i preflight CORS HTTP 204 dla czterech endpointów.

Nie zmieniono nazw funkcji, regionów, whitelisty CORS, kontraktów danych, konfiguracji skalowania ani kodu frontendu.

## Weryfikacja

| Sprawdzenie | Wynik |
| --- | --- |
| Build Functions na Node 22.23.2 | Przechodzi |
| Testy obliczeń i parametrów | 21/21 przechodzi |
| ESLint | Analizuje 36 plików; 0 błędów, 33 ostrzeżenia |
| Silniki zależności z lockfile | Żaden zadeklarowany zakres Node nie wyklucza lokalnego Node 22.23.2 |
| Pełna sekwencja predeploy | Lint → tsc → metadane wersji przechodzi, bez uruchamiania deploya |
| Emulator Functions | Deklarowany i faktycznie używany Node 22; załadowane wszystkie cztery funkcje w us-central1 |
| Poprawne żądania API | 4/4 odpowiada poprawnym JSON, CORS i identyfikatorem buildu |
| Porównanie lokalnie / produkcja | 4/4 przykładowe odpowiedzi JSON identyczne |
| Walidacja bez parametrów | 4/4 zwraca HTTP 400 |
| Preflight CORS z localhost:4200 | 4/4 zwraca HTTP 204 i właściwy allow-origin |

Wszystkie ostrzeżenia lintu dotyczą istniejących asercji non-null `!` w siedmiu modułach kalkulacji. Reguła pozostaje aktywna; ich usunięcie wymaga osobnego uporządkowania typów. Nie blokują predeploya.

Sprawdzenia produkcyjne opisano poniżej. Nie wykonano ponownego buildu frontendu — jego kod i zależności nie były zmieniane w tym etapie. Poprawność nowych emisji obligacji pozostaje zakresem etapu 2.

## Powtarzalne sprawdzenia

```sh
npm --prefix functions run lint
npm run build:functions
npm run test:functions
npm run emulators
# W drugim terminalu:
npm run smoke:api -- --contracts --compare-production
```

## Publikacja i kontrola produkcji

Na polecenie użytkownika wykonano commit, push i deploy wyłącznie Functions do `personal-finance-2ee61`. Zastosowano lokalne hooki lint/build/metadane. Build produkcyjny: `6d4b0c3-2026-10-21T20:17:02.430Z`, pełny commit `6d4b0c3084b53361884a417e333733e4b98addc8`, `dirty: false`.

- Wszystkie cztery dotychczasowe funkcje mają runtime `nodejs22`, stan `ACTIVE` i region `us-central1`.
- Zachowano konfigurację: 256 MiB RAM, 1 CPU, timeout 60 s, współbieżność 80, maksymalnie 100 instancji. Pierwszy deploy ujawnił zmianę limitu na 20; po jawnym ustawieniu 100 ponowny odczyt potwierdził zgodność ze stanem bazowym.
- `smoke:api -- --production --contracts`: 4/4 poprawne odpowiedzi JSON, HTTP 400 bez wymaganych parametrów, preflight HTTP 204 i CORS z localhost.
- `smoke:api -- --compare-production`: 4/4 odpowiedzi lokalnych identycznych z produkcyjnymi.
- Osiem adresów (Cloud Functions i używane przez frontend Cloud Run dla każdej funkcji) zwraca HTTP 200, właściwy nagłówek buildu oraz CORS dla `https://oszczedzify.org`.
- W przeglądarce potwierdzono wyniki trzech kalkulatorów oraz treść artykułu „Jak działa ten kalkulator?”.
- Odczyt 44 wpisów logów po ponownym wdrożeniu, od 20:17:04 do 20:19:42 UTC: brak ERROR/CRITICAL/ALERT/EMERGENCY i HTTP 5xx. To kontrola krótkiego okna po wdrożeniu. Pierwszy deploy zawierał przejściowy błąd DeadlineExceeded operacji UpdateFunction; końcowe odczyty i testy potwierdziły zakończenie aktualizacji.
- Hosting zachował wersję `7982bf5807b070e8` z 03.02.2025. Nie publikowano frontendu.

Narzędzie Firebase zwróciło status `failed` z komunikatem „Functions successfully deployed but could not set up cleanup policy in location us-central1”. Dotyczy to automatycznego sprzątania obrazów w Artifact Registry, a nie publikacji Functions. Nie zmieniano polityki retencji; pozostaje do osobnego uporządkowania. Sukces wdrożenia potwierdzono niezależnie stanem funkcji, runtime i nagłówkami aktywnego buildu.

Zanonimizowany zapis wersji i konfiguracji: [baseline wdrożenia](baseline/2026-10-21-stage1-deploy.json).

Procedura odtworzenia poprzedniej logiki: zachować poprzedni kod i konfigurację, ale wdrożyć je na wspieranym Node 22. Nie zakładać możliwości redeploya Node 20 po terminie jego wycofania. Etap 2 nie został rozpoczęty.

Źródła: [Firebase — wybór runtime](https://firebase.google.com/docs/functions/manage-functions#set_nodejs_version), [ESLint 8 — flat config](https://eslint.org/docs/v8.x/use/configure/configuration-files-new).
