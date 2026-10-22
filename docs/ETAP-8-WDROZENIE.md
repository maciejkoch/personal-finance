# Etap 8 — publikacja i kontrola produkcji

Data: 22.10.2026. Na polecenie użytkownika wykonano commit, push na `main` i wdrożenie Firebase Hosting projektu `personal-finance-2ee61`. Publikacja obejmuje również wcześniejsze, jeszcze niewdrożone etapy 5–7: Angular 22.2.3, Signal Forms i zoneless.

## Opublikowana wersja

- Źródła: `e7e104eeb128d44e0b85047d70af0454f10db0b7`, czysty katalog roboczy podczas buildu.
- Build: `e7e104e-2026-10-22T18:38:47.613Z`, API production, oferta `2026-10-v1`, obliczenia v2.
- Hosting version: `ab563bfaf823b781`.
- Release: `1792694428430000`, 22.10.2026, godz. 20:40:28 Europe/Warsaw.
- Opublikowano dokładnie artefakt sprawdzony lokalnie; bez ponownego buildu między odbiorem i deployem.
- Functions nie były wdrażane. Produkcyjne SDK, runtime, CORS i obliczenia backendu pozostają bez zmian.

Etap 8 wcześniej przeszedł 28 testów frontendu w 10 zestawach, lint i kontrolę typów oraz 19 próbek axe bez wykrytych naruszeń. Zakres i ograniczenia audytu opisuje [raport zmian](ETAP-8-RAPORT.md). Po commicie wykonano świeży build produkcyjny ośmiu tras i ponowną kontrolę na emulatorze Hostingu.

Pierwsza próba przez narzędzie MCP Firebase zakończyła się błędem rozpoznawania domyślnej witryny, przed wysyłką plików. Wdrożenie wykonano przez Firebase CLI z jawnym `--project personal-finance-2ee61 --only hosting`; konfiguracja projektu nie wymagała zmiany.

## Kontrola produkcji

- `smoke:hosting`: siedem stron ma HTTP 200, właściwe H1, title/description, canonicale, Open Graph i JSON-LD. Przekierowania 301, rzeczywiste 404, robots i sitemap są poprawne.
- Wszystkie 35 plików JS/CSS/obrazów/ikon mają HTTP 200 i zawartość identyczną z lokalnym artefaktem. `version.json` jest również identyczny i wskazuje czysty commit `e7e104e`.
- `smoke:api -- --production --contracts`: cztery endpointy, walidacja, błędy żądań i CORS przechodzą kontrolę.
- `www.oszczedzify.org`: prawidłowy TLS oraz 301 dla siedmiu stron, z zachowaniem ścieżek i query string.
- Przeglądarka potwierdza Angular 22.2.3, poprawne canonicale, `index, follow` i brak błędów konsoli podczas nawigacji oraz używania trzech kalkulatorów.
- Obligacje 10 sztuk / 2 lata: tabela pokazuje 1072,41 zł dla ROD; wykres jest zamontowany. Okres 1,5 roku pokazuje błąd walidacji. Dokument mieści się w szerokości okna; tabela przewija się osobno.
- Cel 10 000 zł / 2 lata / inflacja 3% / stopa 5%: 425,03 zł miesięcznie. Pominięcie obu stóp daje 416,67 zł i wyłącza odpowiednie pola. Ponowne włączenie odtwarza ich wartości.
- Regularne wpłaty 500 zł / 2 lata / 5%: 12 480,30 zł po podatku.

Zachowano dotychczasowe zachowanie dokumentu technicznego `/404`: Hosting z `cleanUrls` może udostępniać go z HTTP 200, ale dokument ma `noindex` i nie ma canonicala. Dowolne nieistniejące strony zwracają HTTP 404.

## Poprzednie wydanie

W historii Hostingu pozostaje wersja `aedba44b7203bf49`, release `1792666201538000`, build `d7d8e90-2026-10-22T10:49:16.089Z` z etapu 4. Nie wykonywano rollbacku ani zmian DNS.

Szczegóły zapisano w [pliku bazowym](baseline/2026-10-22-stage8-deploy.json). Etapy 5–8 są opublikowane i sprawdzone na produkcji. Kolejny zakres planu: etap 9a, SDK i zależności Functions.
