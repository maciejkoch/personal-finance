# Etap 0 — raport bazowy

Data: 21.10.2026. Źródłowy commit: `6de87ec121fca73c9e98d25bb3ece7b88251f4a6`; raport opisuje stan przed commitem etapu 0. Nie wykonano wdrożenia produkcyjnego.

## Wyniki sprawdzeń

| Sprawdzenie | Przed zmianami | Po przygotowaniu etapu 0 |
| --- | --- | --- |
| Produkcyjny build frontendu | Przechodzi, 6 prerenderowanych tras | Przechodzi, 6 tras |
| Testy frontendu | Dwie niedziałające suite: stary NxWelcome i brak ActivatedRoute w teście menu | 6 testów w 3 suite przechodzi |
| Testy Functions | Komenda npm wybierała tylko 11 testów | Komenda wybiera wszystkie 21 testów, wszystkie przechodzą |
| Build Functions | Przechodzi | Przechodzi; wersję generuje lokalny skrypt i hook predeploy |
| API | Brak automatycznego porównania środowisk | Cztery endpointy emulatora i produkcji zwracają równe JSON dla czterech stałych przypadków |
| CORS i metadane lokalnych Functions | Tylko istniejące ustawienia CORS | Sprawdzone CORS dla localhost:4200 i identyfikator buildu w nagłówku |
| Izolacja środowisk | URL produkcyjne zapisane w czterech serwisach | Lokalny start używa emulatora; build produkcyjny nie zawiera adresu 127.0.0.1:5001 |
| Staging bez konfiguracji | Brak osobnego trybu | Start/build kończy się czytelnym błędem, bez przejścia na produkcję |
| Siedem lokalnych adresów stron | Aplikacja była dostępna | Wszystkie sprawdzone adresy odpowiadają HTTP 200; obligacje zweryfikowane też w przeglądarce |

Przechodzące testy opisują aktualny algorytm. Nie stanowią jeszcze potwierdzenia zgodności obliczeń z ofertą obligacji na październik 2026. Porównanie lokalnego API z produkcją dotyczy sprawdzonych przypadków, nie wszystkich możliwych danych wejściowych.

## Zmiany przygotowawcze

- Wspólny, wstrzykiwany zestaw endpointów `API_ENDPOINTS` dla wszystkich czterech klientów HTTP.
- Warianty local/production/staging i powtarzalne komendy npm. `npm start` domyślnie korzysta z emulatora. Produkcja zachowuje dotychczasowe endpointy.
- Staging wymaga jawnego adresu innego backendu; nie utworzono nowego projektu ani nie przyznano nowych uprawnień.
- Emulatory Functions na 5001, Hosting na 5050 i UI na 4000, związane z 127.0.0.1. Port 5000 zajmuje systemowy Control Center macOS, dlatego wybrano 5050.
- `version.json` frontendu i nagłówek `X-Oszczedzify-Build` Functions. Metadane obejmują commit, dirty, czas, tryb API i hash obecnych parametrów obligacji. Każde środowisko ma osobny katalog metadanych; sprawdzono równoległy start lokalny i build produkcyjny bez nadpisywania wersji. `offerVersion` ma wartość `legacy-unversioned` do etapu aktualizacji danych.
- Naprawiony test powłoki aplikacji i dostawca routera w teście nawigacji; nowe testy sprawdzają przekierowanie wszystkich klientów na lokalne API i zachowanie serializacji danych.
- Testy backendu wykonywane na skompilowanym JS z rekurencyjnym globem; nie polegają już na przypadkowym rozszerzeniu globu powłoki ani na niezadeklarowanym ts-node z katalogu nadrzędnego.
- Komenda lint Functions jawnie wskazuje `src`, aby nie zwracała pozornego sukcesu bez analizy plików.

Nie zmieniono stawek obligacji, algorytmów, publicznych URL, regionów ani runtime produkcyjnych Functions. Na moment zakończenia etapu nie wykonano deploya, commita ani pusha.

## Firebase — stan odczytany z produkcji

Projekt: `personal-finance-2ee61`. Dane historyczne bez tokenów i adresów kont znajdują się w [baseline/2026-10-21.json](baseline/2026-10-21.json).

Hosting ma 79 wydań od 20.10.2024 do 03.02.2025. Jedyny kanał to `live`.

| Wydanie | Wersja Hosting | Czas UTC |
| --- | --- | --- |
| Obecne | `7982bf5807b070e8` | 2025-02-03 12:31:44.813 |
| Poprzednie | `c68689914cd15ca2` | 2025-01-27 16:28:53.758 |
| Wcześniejsze | `6a8a21a26ced2f16` | 2025-01-27 16:19:22.527 |

Wszystkie cztery Functions (`articleHttpFunction`, `calculateSavingsHttpFunction`, `calculateRegularContributionHttpFunction`, `calculateTreasuryBondsHttpFunction`) mają:

- stan ACTIVE, 2. generację, region `us-central1`, runtime `nodejs20`;
- 256 MiB, timeout 60 s, concurrency 80 i maxInstances 100;
- source hash Firebase `10e6c209df753501b5cefb4809e07ddb8374567c`.

Obecne wydania nie podają SHA Git. Odczytane metadane i porównanie przykładowych odpowiedzi nie dowodzą identyczności całych źródeł. Nowe oznaczenia wersji zaczną być widoczne na produkcji dopiero po przyszłym wdrożeniu.

Konsola WWW Firebase zgłaszała błąd ładowania statusu akceptacji regulaminu. Stan funkcji i pełną historię Hosting odczytano przy użyciu uwierzytelnionych narzędzi oficjalnego Firebase CLI 15.34.0, bez zmiany regulaminów i ustawień projektu.

## Google Search Console

Usługa domenowa: `sc-domain:oszczedzify.org`. Raporty odczytano w zalogowanej przeglądarce. Nie przesyłano mapy witryny i nie zgłaszano żądań indeksacji w tym etapie.

| Okres raportu | Kliknięcia | Wyświetlenia | CTR | Średnia pozycja |
| --- | --- | --- | --- | --- |
| 20.07.2026–19.10.2026, 3 miesiące | 1 | 5 | 20% | 2,4 |
| 20.06.2025–19.10.2026, 16 miesięcy | 1 | 15 | 6,7% | 1,5 |

- W obu okresach ruch przypisany jest wyłącznie do `https://oszczedzify.org/`.
- W okresie 16 miesięcy: mobile 1 kliknięcie / 2 wyświetlenia, desktop 0 / 13.
- Tabela zapytań nie udostępnia wierszy. Przy tak małej próbie nie da się wiarygodnie ocenić fraz ani interpretować pozycji 1,5 jako dobrej widoczności na zapytania o kalkulatory.
- Raport indeksowania z aktualizacją 12.10.2026: 1 strona zindeksowana i 2 niezindeksowane, z przyczynami 404 i przekierowanie. Przykład 404: `http://www.oszczedzify.org/`.
- Brak przesłanych sitemap. Raport ręcznych działań: „Nie wykryto problemów”.
- Osobna inspekcja każdego z trzech kalkulatorów: URL nie znajduje się w Google, przyczyna „Adres URL jest Google nieznany”; bez wykrytej mapy witryny, strony odsyłającej i daty skanowania.
- Raport Core Web Vitals na przeglądzie usługi nie ma danych terenowych.

Wniosek: w pierwszej kolejności trzeba poprawić odkrywanie URL i indeksowanie, a dopiero potem oceniać pozycje i CTR. Inspekcja nie wskazuje, że Google odrzucił kalkulatory po przeczytaniu ich treści — wskazuje brak znanego URL. Szczegółowe przyczyny biznesowe niskiego ruchu nie wynikają z samego tego raportu.

## Znane problemy pozostawione na właściwe etapy

1. Functions nadal deklarują i produkcyjnie używają Node 20. Emulator działa na zainstalowanym Node 22 i zgłasza tę różnicę. Aktualizacja runtime to etap 1.
2. Rzeczywisty lint Functions nie przechodzi: config używa `parser` na najwyższym poziomie, mimo formatu flat config. Wcześniejsza komenda bez `src` kończyła się bez sprawdzenia plików. Naprawa przed następnym deployem Functions należy do etapu 1.
3. Stare stawki i odwrotne etykiety ROS/ROD pozostają do etapu 2.
4. Techniczne problemy SEO z planu pozostają do etapu 3: ogólne metadane, brak canonicali, robots/sitemap zwracające HTML, fallback HTTP 200, domena www.
5. Build zgłasza CommonJS Lodash i pominięte selektory `.tooltip:has()`. Jest też ostrzeżenie o starych danych Browserslist i przestarzałym setupie Jest. Do odpowiednich etapów aktualizacji.
6. Globalny `parser: angular` w `.prettierrc` błędnie obejmuje także TS/JS. Nowe pliki sformatowano z jawnym parserem; uporządkowanie globalnej konfiguracji jest w etapie narzędziowym.
7. Staging nie ma jeszcze wskazanego osobnego backendu ani skonfigurowanej dla niego listy CORS. Frontend preview na Hosting nie izoluje Functions.

## Odtworzenie i publikacja

Komendy i zasady w [README](../README.md). W katalogu `dist` zachowano sprawdzony build produkcyjny z `apiTarget: production`; działający dev server używa local.

Przed wydaniem: build właściwego środowiska, testy, przegląd użytkownika, jawne polecenie deploya. Po wydaniu odczyt `version.json`, nagłówka Functions i nowe identyfikatory Hosting. Przy lokalnych zmianach przed publikacją trzeba zachować także dokładną wersję źródeł/patch — sam SHA z `dirty: true` nie pozwoli odtworzyć zmian.

Hosting można przywrócić do zapisanego poprzedniego wydania. Functions wymagają ponownego wdrożenia poprzedniego kodu i konfiguracji na obsługiwanym runtime; po wycofaniu Node 20 nie można zakładać powrotu na ten runtime.

Etap 0 kończy się przeglądem użytkownika. Etap 1 nie został rozpoczęty.

## Kontrola przed commitem

Generowanie metadanych Functions przeniesiono do lokalnej komendy `build:functions` i hooka Firebase predeploy. Sam build paczki Functions to `tsc`, bez zależności od Git ani skryptów spoza uploadowanego katalogu. Obliczenia pozostają bez zmian.
