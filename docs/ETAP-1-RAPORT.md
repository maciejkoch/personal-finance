# Etap 1 — runtime Functions i lint

Data: 21.10.2026. Baza: commit etapu 0 `3aaf765`. Commit implementacji `5e72874` został wypchnięty i wdrożony. Kontrola produkcji wykryła zmianę domyślnego limitu instancji ze 100 na 20; poprawka przypina dotychczasowy limit i oczekuje na ponowne wdrożenie.

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

Emulator i zgodność kilku odpowiedzi nie zastępują testów środowiska Google po wdrożeniu. Nie wykonano ponownego buildu frontendu — jego kod i zależności nie były zmieniane w tym etapie. Poprawność nowych emisji obligacji pozostaje zakresem etapu 2.

## Powtarzalne sprawdzenia

```sh
npm --prefix functions run lint
npm run build:functions
npm run test:functions
npm run emulators
# W drugim terminalu:
npm run smoke:api -- --contracts --compare-production
```

## Publikacja po przeglądzie

Po osobnym poleceniu użytkownika można wykonać `npm run deploy:functions`. Firebase uruchomi lokalne hooki lint/build/metadane i wdroży cztery Functions na runtime Node 22. Hosting nie jest objęty tym poleceniem.

Po wdrożeniu należy:

1. Odczytać metadane Functions i potwierdzić runtime `nodejs22`, stan ACTIVE, cztery dotychczasowe nazwy, region `us-central1` oraz zachowaną konfigurację.
2. Uruchomić `npm run smoke:api -- --production --contracts` i porównać nagłówek `X-Oszczedzify-Build` z opublikowaną wersją.
3. Sprawdzić trzy kalkulatory i artykuł oraz logi błędów Functions.

Procedura odtworzenia poprzedniej logiki: zachować poprzedni kod i konfigurację, ale wdrożyć je na wspieranym Node 22. Nie zakładać możliwości redeploya Node 20 po terminie jego wycofania. Etap 2 nie został rozpoczęty.

Źródła: [Firebase — wybór runtime](https://firebase.google.com/docs/functions/manage-functions#set_nodejs_version), [ESLint 8 — flat config](https://eslint.org/docs/v8.x/use/configure/configuration-files-new).
