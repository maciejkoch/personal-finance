# Firebase App Check — plan i wdrożenie

## Zakres i architektura

1. ReCAPTCHA Enterprise w Firebase Web SDK, ładowana dopiero przy żądaniu API w przeglądarce. SDK współdzieli inicjalizację i odnawia tokeny.
2. Interceptor Angulara wysyła `X-Firebase-AppCheck` wyłącznie do czterech dokładnych adresów z `API_ENDPOINTS` (także z parametrami zapytania). Inne zasoby i hosty nie dostają tokenów.
3. Wspólna bramka Admin SDK weryfikuje token przed wykonaniem każdego z ośmiu eksportów HTTP: kalkulatory, katalog/oferta obligacji i artykuły, zarówno Warszawa, jak i starsze aliasy USA. Nie ma obejścia przez stary region. Opcjonalne `APP_CHECK_APP_IDS` ogranicza do konkretnych aplikacji projektu.
4. CORS obsługuje OPTIONS przed weryfikacją. Brak tokenu, token nieprawidłowy/wygasły lub aplikacja poza allowlistą oznacza HTTP 401 i `Cache-Control: no-store`. Błędny tryb konfiguracji daje 503.
5. Prerender korzysta z lokalnych artykułów i nie inicjalizuje SDK. Frontend emulatora pomija atestację. Scheduler i narzędzia administracyjne używające Admin SDK nie przechodzą przez HTTP, więc nie wymagają App Check. App Check nie zastępuje IAM, uwierzytelniania ani reguł Firestore.

Firebase Web SDK jest przypięty do 12.18.0; overrides `@firebase/app=0.16.1` i `@firebase/app-compat=0.5.17` utrzymują zgodność z Node 22 oraz jedną instancję rejestru SDK. Nowsze wydania tych modułów wymagają Node 24.12. Przy aktualizacji SDK sprawdź te ograniczenia. Walidator konfiguracji i moduły Firebase są ładowane dynamicznie.

## Konfiguracja i kolejność uruchomienia

Repozytorium domyślnie używa `off`: samo scalenie PR nie uruchamia reCAPTCHA ani blokady ruchu. Ten PR nie rejestruje kluczy i nie zmienia produkcyjnych ustawień Firebase.

1. Zarejestruj aplikację Web w projekcie `personal-finance-2ee61` (lub użyj istniejącej). Utwórz **score-based reCAPTCHA Enterprise site key**, dodaj domeny `oszczedzify.org` oraz `personal-finance-2ee61.web.app` i zarejestruj provider w Firebase Console → App Check. Ustal próg oceny i TTL w konsoli. Dla stagingu użyj oddzielnego projektu, klucza i domen.
2. Ustaw Functions `APP_CHECK_MODE=monitor` w pliku `functions/.env.<project-id>`; opcjonalnie `APP_CHECK_APP_IDS=<web-app-id>`. Wdróż wszystkie osiem funkcji HTTP. Nie trzeba ustawiać `enforceAppCheck` dla funkcji callable: aplikacja używa **onRequest**, weryfikacja odbywa się w naszym kodzie.
3. Zmień `public/app-check.json` przed buildem/wdrożeniem Hosting:

   ```json
   {
     "mode": "monitor",
     "siteKey": "<publiczny-klucz-recaptcha-enterprise>",
     "firebase": {
       "apiKey": "<firebase-web-api-key>",
       "appId": "<firebase-web-app-id>",
       "projectId": "personal-finance-2ee61"
     }
   }
   ```

   To publiczne ustawienia SDK, bez sekretów. Nie dodawaj tu kont serwisowych, kluczy prywatnych ani debug tokenów. Plik ma nagłówek `no-store`. Frontend pobiera go raz na sesję aplikacji. Nieprawidłowy/niedostępny JSON blokuje żądanie API i może być ponownie pobrany przy kolejnej próbie.
4. Wdróż Hosting. Sprawdź prawdziwą przeglądarką wszystkie kalkulatory, zmianę oferty obligacji, artykuły oraz odświeżanie strony. Sprawdź w Network obecność nagłówka i brak wycieków do innych hostów. Obserwuj Cloud Logging `jsonPayload.message="APP_CHECK_REQUEST"` oraz `jsonPayload.outcome` (`valid`, `missing`, `invalid`, `wrong-app`). Logi nie zawierają tokenów ani query stringów. W monitorze błędy atestacji klienta nie blokują działania.
5. Po potwierdzeniu poprawnych tokenów ustaw frontend `mode=enforce` i wdroż Hosting, następnie Functions `APP_CHECK_MODE=enforce`. Uwzględnij otwarte sesje ze starym klientem: wymagają odświeżenia. Sprawdź, że bezpośrednie żądania bez tokenu i z fałszywym tokenem dostają 401 w obu regionach, a przeglądarka nadal działa. Enforcement dla naszego HTTP ustawia zmienna Functions, nie przełącznik Firestore w konsoli.

## Emulatory, CI i debugowanie

- `npm start` + `npm run emulators`: lokalny frontend pomija SDK. Domyślny tryb backendu `off` zachowuje istniejące smoke testy.
- `npm run test:app-check:emulator`: oddzielny test z `APP_CHECK_MODE=enforce` sprawdza wszystkie osiem prawdziwych handlerów, brak/fałszywy token, CORS preflight i brak cache dla 401. Nie potrzebuje produkcyjnych kluczy ani poświadczeń. W `enforce` nie ma obejścia emulatorowego; tylko `monitor` pomija lokalną weryfikację.
- Testy jednostkowe obejmują również poprawny token, allowlistę aplikacji, tryby, błędną konfigurację, izolację nagłówka i błąd pobrania tokenu. Walidacja rzeczywistej atestacji wymaga zarejestrowanej aplikacji i przeglądarki; mock nie potwierdza konfiguracji klucza w konsoli.
- Dla lokalnej przeglądarki przeciwko chronionemu backendowi zarejestruj debug token w Firebase Console. Ustaw `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` w lokalnym środowisku przed inicjalizacją SDK zgodnie z dokumentacją. Nigdy nie publikuj debug tokenu ani nie dodawaj localhost do klucza produkcyjnego. Preview musi mieć osobny klucz/domenę i backend dopuszczający jej Origin; sam App Check nie zmienia CORS.
- Istniejące smoke testy wykonywane bezpośrednio przeciw produkcji bez tokenu będą po enforcement dostawać 401. Testy obliczeń i kontraktów uruchamiaj w emulatorze. Test end-to-end na chronionym backendzie wykonuj przez przeglądarkę z poprawną atestacją lub kontrolowanego klienta z zarejestrowanym debug providerem.

## Rollback

Najpierw przestaw **wszystkie** funkcje HTTP na `APP_CHECK_MODE=monitor` (lub `off`) i wdróż. Dopiero potem ustaw `public/app-check.json` na `{"mode":"off"}` i wdróż Hosting. W ten sposób klient bez tokenów nie trafi na backend wymagający atestacji. Nie ma zmian w danych ani schemacie bazy.

## Dokumentacja źródłowa

- [Web + reCAPTCHA Enterprise](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)
- [Tokeny w żądaniach do własnego backendu](https://firebase.google.com/docs/app-check/web/custom-resource)
- [Weryfikacja Admin SDK dla własnego backendu](https://firebase.google.com/docs/app-check/custom-resource-backend)
- [Debug provider](https://firebase.google.com/docs/app-check/web/debug-provider)
