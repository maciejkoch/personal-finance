# Etap 10 — publikacja i kontrola produkcji

Data: 23.10.2026. Użytkownik polecił commit, push i deploy, a podczas odbioru zgłosił rozjeżdżanie się nagłówków i wartości przy poziomym przewijaniu tabeli obligacji. Opublikowano etap 10 oraz poprawkę tabeli. [Wyniki maszynowe](baseline/2026-10-23-stage10-deploy.json).

## Opublikowane wersje

| Część                             | Commit                                     | Build / wydanie                                                                |
| --------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| Treści, linkowanie i wydajność    | `41c1a05016be62fe1c761abebd7f1d27b507a748` | Hosting `61f5253559dbb857`, release `1792743600243000`, 10:20:00 Europe/Warsaw |
| Funkcja artykułów                 | `41c1a05`                                  | `41c1a05-2026-10-23T08:17:57.553Z`, Node 22, us-central1                       |
| Końcowy Hosting z poprawką tabeli | `76e165b58b87efa553e677342db31c6ae23944d9` | Hosting `44a4a37eb5997917`, release `1792744074261000`, 10:27:54 Europe/Warsaw |

Końcowy build frontendu: `76e165b-2026-10-23T08:27:14.636Z`, `dirty: false`, API production. Funkcja artykułów również została zbudowana z czystego katalogu roboczego. Oferta `2026-10-v1`, obliczenia v2, identyczny hash konfiguracji oferty w obu częściach.

Oba commity źródeł wypchnięto na `origin/main`. Po kontroli opublikowano dokładnie sprawdzone artefakty; między lokalnym odbiorem a publikacją nie wykonywano kolejnego buildu. Trzy funkcje obliczeniowe nadal mają build `be222d7-2026-10-22T19:13:53.660Z`; ich ponowne wdrożenie nie było potrzebne.

## Poprawka poziomego przewijania tabeli

Przyczyną była klasa daisyUI `table-pin-cols`, która nadaje `position: sticky`, `left: 0` i `right: 0` wszystkim komórkom `<th>`. W nagłówku wszystkie komórki były `<th>`, a w wierszach wyników tylko kolumna roku. W efekcie nagłówki i wartości miały inne reguły przypięcia.

Usunięto `table-pin-cols` i nadano jawnie `sticky left-0` wyłącznie nagłówkowi oraz komórkom kolumny „Rok”. Dodano nieprzezroczyste tło i warstwę nad przesuwanymi komórkami. Nagłówki mają `scope="col"`, a rok w każdym wierszu `scope="row"`. Kolumna inflacji, razem z nagłówkiem, przewija się z pozostałymi wynikami.

Odbiór w lokalnej przeglądarce i na produkcji, viewport 1280 px, obszar tabeli 979 px:

| Pozycja                        | Przed przewinięciem | Po przewinięciu o 71,5 px |
| ------------------------------ | ------------------: | ------------------------: |
| Lewa krawędź nagłówka „Rok”    |              278 px |                    278 px |
| Lewa krawędź wartości roku     |              278 px |                    278 px |
| Lewa krawędź nagłówka inflacji |          1206,80 px |                1135,30 px |
| Lewa krawędź wartości inflacji |          1206,80 px |                1135,30 px |

Jedyny nagłówek ze stylem sticky to „Rok”. Poprawkę potwierdzono przy rzeczywistym poziomym przewijaniu, bez ustawiania pozycji skryptem. Lint, produkcyjny build, kontrola treści i smoke Hostingu po poprawce przeszły. Nie zmieniono wyników obliczeń.

## Kontrola produkcji

- Siedem kanonicznych stron, H1, metadane, canonicale, JSON-LD, robots i sitemap — OK. Przekierowania 301 i rzeczywiste 404 — OK.
- `version.json` jest identyczny z lokalnym artefaktem i wskazuje czysty commit końcowego frontendu.
- Wszystkie **47 zasobów** JS/CSS/obrazów/ikon/manifestu oraz **7 dokumentów HTML** ma zawartość identyczną z lokalnym buildem. Zasoby z hashem mają roczny immutable cache; HTML nie ma immutable, a `version.json` ma no-store.
- Cztery API przeszły `smoke:api -- --production --contracts`. Przykłady obligacji, podatek, sześć błędnych żądań i CORS przeszły `smoke:bonds -- --production`.
- Oba artykuły z produkcyjnej funkcji są identyczne z lokalnym Markdown, mają nagłówek nowego buildu i prawidłowy CORS. Brakujący artykuł zwraca 404.
- Sprawdzone wyniki API: cel → 425,03 zł miesięcznie; regularne wpłaty → 12 480,30 zł netto; jedna TOS po 3 latach → 111,16 zł. Nagłówki trzech kalkulatorów potwierdzają zachowanie poprzedniego backendu.
- Przeglądarka potwierdziła formularz regularnego oszczędzania i wykres słupkowy, nawigację do poprawionego artykułu oraz bezpośrednie odświeżenie z poprawnym canonicalem i datą. Końcowy odbiór tabeli potwierdził też wykres liniowy. Sprawdzona sesja bez błędów konsoli.
- Cloud Logging dla zarządzanych przez Functions rewizji Cloud Run, severity ERROR lub wyższe, od 08:17 UTC do odczytu 08:22:34 UTC — brak wpisów. Kontrola dotyczy tego okna; późniejsza poprawka zmieniała wyłącznie Hosting.

## PageSpeed po publikacji

Po pierwszej publikacji Hostingu `41c1a05`, przed poprawką tabeli, wykonano dwa pomiary tej samej strony obligacji. Lighthouse 13.5.0, mobile, Moto G Power, Slow 4G:

| Metryka                      | Przed publikacją, 09:17 | Po, 10:20 | Powtórzenie, 10:21 |
| ---------------------------- | ----------------------: | --------: | -----------------: |
| Performance                  |                      97 |        88 |                 97 |
| FCP                          |                   0,8 s |     1,4 s |              0,8 s |
| LCP                          |                   2,4 s |     3,6 s |              2,4 s |
| TBT                          |                  140 ms |    130 ms |             110 ms |
| CLS                          |                   0,004 |     0,005 |              0,005 |
| Speed Index                  |                   1,6 s |     3,1 s |              1,8 s |
| Szacowane straty cache       |                 234 KiB |     2 KiB |              2 KiB |
| Szacowany niewykorzystany JS |                 168 KiB |   139 KiB |            139 KiB |

Raporty: [przed](https://pagespeed.web.dev/analysis/https-oszczedzify-org-calculators-treasury-bonds/qt2kzjtkoq?form_factor=mobile), [pierwszy po](https://pagespeed.web.dev/analysis/https-oszczedzify-org-calculators-treasury-bonds/7tpb3m39hz?form_factor=mobile), [powtórzenie](https://pagespeed.web.dev/analysis/https-oszczedzify-org-calculators-treasury-bonds/s7eip264lw?form_factor=mobile).

Accessibility, Best Practices i SEO: po 100 w obu pomiarach po publikacji. Pierwszy pomiar miał dłuższe renderowanie tekstu w hero; gorszego LCP nie powtórzono w drugiej próbie. Oba wyniki pozostają w raporcie. Ta mała próba nie dowodzi stałej poprawy ani regresji LCP; potwierdzono redukcję kodu wykresów i zmianę cache. Nadal brak danych rzeczywistych użytkowników i INP. Nie powtarzano PSI po samej poprawce przypięcia komórek tabeli.

## Uwagi operacyjne i odtworzenie

Konektor Firebase dla targetu `functions:articleHttpFunction` zgłosił success, lecz nie zmienił produkcyjnej treści ani lokalnych metadanych buildu. Przed przejściem do Hostingu wykryto to porównaniem odpowiedzi z lokalnym Markdown. Skuteczny deploy wykonano przypiętym CLI `firebase-tools@15.34.1` z jawnym projektem i targetem funkcji.

CLI potwierdziło udaną aktualizację funkcji, po czym zakończyło komendę błędem dotyczącym istniejącego braku polityki sprzątania obrazów Artifact Registry. Jest to ten sam problem utrzymania artefaktów co przy etapie 9. Nie ustawiano polityki usuwania i nie używano force. Wdrożenie potwierdzono treścią obu artykułów, metadanymi oraz testami HTTP. Obie publikacje Hostingu zakończyły się Deploy complete. Konektor logów zwrócił błąd wewnętrzny; kontrolę ERROR wykonano bezpośrednio przez Cloud Logging API.

Poprzednia wersja Hostingu sprzed etapu 10: `0133aaae92f3b24c`, release `1792696650476000`. Pierwsza wersja etapu 10: `61f5253559dbb857`. Obie pozostają punktami odtworzenia w historii. Funkcję artykułów można odtworzyć przez ponowne wdrożenie wcześniejszych źródeł na obsługiwanym Node 22.

Publikacja i poprawka tabeli są zakończone. Aktualne raporty GSC, kontrola viewportu 390 px oraz porównania ruchu i indeksowania po 2–4 i 6–8 tygodniach nadal pozostają otwarte. Okna od faktycznej daty publikacji: 6–20.11 i 4–18.12.2026. Nie utworzono automatyzacji.
