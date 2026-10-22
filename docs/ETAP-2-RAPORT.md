# Etap 2 — oferta obligacji i kalkulator

Data: 21.10.2026. Baza repozytorium: `001e38b` (produkcyjne Functions: `6d4b0c3`). Etap opublikowano 22.10.2026 z commita `caea9b4`; szczegóły zawiera [raport wdrożenia](ETAP-2-WDROZENIE.md). Etap 3 pozostaje poza zakresem.

## Dane i źródła

Jedynym źródłem danych dla UI, Functions i metadanych buildu jest `functions/src/treasury-bonds/treasury-bonds.offer.json`, wersja `2026-10-v1`. Zawiera miesiąc sprzedaży, typ i serię, pierwszą stopę, marżę, indeksację, wypłatę/kapitalizację, zapadalność, cenę zamiany, opłatę i ochronę kapitału, ograniczenia dyspozycji oraz źródło. Zwykła aktualizacja miesiąca nie wymaga zmiany algorytmu.

Pobrano i odczytano siedem listów z 21.09.2026, w tym załączniki ze wzorami. Numery i SHA-256 PDF zapisano w [rejestrze źródeł](baseline/2026-10-21-stage2-offer-sources.json).

| Seria | List | Pierwsza stopa | Kolejne okresy | Opłata maks. / szt. | Cena zamiany lub zakupu |
| --- | --- | --- | --- | --- | --- |
| [ROR1027](https://www.obligacjeskarbowe.pl/media_files/f4e264bb-537d-4a7e-813e-e4f099ea0cc5.pdf) | 95/2026 | 4,00% | NBP + 0,00 p.p. | 0.50 zł | 99.90 zł |
| [DOR1028](https://www.obligacjeskarbowe.pl/media_files/d4585b0f-349e-42b0-a399-a43051310cc3.pdf) | 96/2026 | 4,15% | NBP + 0,15 p.p. | 0.70 zł | 99.90 zł |
| [TOS1029](https://www.obligacjeskarbowe.pl/media_files/c15a26ae-de6e-4b89-a137-cb16687a7b0a.pdf) | 97/2026 | 4,40% | stałe przez 3 lata | 1.00 zł | 99.90 zł |
| [COI1030](https://www.obligacjeskarbowe.pl/media_files/e156037b-5b0c-40b8-85e1-0b205d4ac395.pdf) | 98/2026 | 4,75% | inflacja + 1,50 p.p. | 2.00 zł | 99.90 zł |
| [EDO1036](https://www.obligacjeskarbowe.pl/media_files/4f5f6353-fdcd-4b7e-b44f-63088098c534.pdf) | 99/2026 | 5,35% | inflacja + 2,00 p.p. | 3.00 zł | 99.90 zł |
| [ROS1032](https://www.obligacjeskarbowe.pl/media_files/429484ab-572e-4c43-9f64-3ea8fea13437.pdf) | 100/2026 | 5,00% | inflacja + 2,00 p.p. | 2.00 zł | 100.00 zł |
| [ROD1038](https://www.obligacjeskarbowe.pl/media_files/03e2bc03-0128-49b7-be93-669ef058b7c5.pdf) | 101/2026 | 5,60% | inflacja + 2,50 p.p. | 3.00 zł | 100.00 zł |

Dodatkowe źródła podatku i opłat: [oficjalny informator, część 9](https://www.obligacjeskarbowe.pl/informator-obligacyjny/) i [PKO BP — rozliczenia podatkowe](https://www.pkobp.pl/regulacje-prawne/rozliczenia-podatkowe). Stopa podatku: 19%; dochód z wcześniejszego wykupu pomniejszamy o opłatę; podatek zaokrąglamy w górę do grosza. Przyjęto jedną wypłatę dla całego portfela. Rozbicie dyspozycji może zmienić zaokrąglenia.

## Obliczenia

Siedem powielonych implementacji zastąpiono wspólną symulacją przepływów. Dotychczasowe moduły i nazwy funkcji pozostają adapterami. Nie migrowano frameworka ani struktury aplikacji.

- Należność za jedną sztukę zaokrąglamy przed przemnożeniem przez liczbę sztuk. Kapitalizacja odracza podatek do wypłaty. TOS przy zapadalności używa iloczynu z załącznika 1, przy wcześniejszym wykupie zaokrąglonej podstawy N(k−1) z załącznika 2.
- Wypłacony kupon jest osobną gotówką: nie pokrywa drugi raz opłaty i nie jest ponownie opodatkowany. Brak ujemnego podatku lub zwrotu przy stracie; uwzględniamy dyskonto zakupu.
- Przy zapadalności opłata wynosi zero. Dla ROR/DOR/COI po pierwszym kuponie może naruszyć nominał; dla TOS/EDO/ROS/ROD jest ograniczona do odsetek.
- Ponowny zakup wykorzystuje cenę zamiany dla wykupu i ostatniego kuponu, a cenę 100 zł dla wcześniejszej gotówki. ROS nie ma błędnego dyskonta 99,90 zł. Zachowujemy resztę gotówki bez podwójnego doliczania. W końcowym punkcie nie kupujemy kolejnej emisji.
- TOS nie zależy od WIBOR. Roczna indeksacja używa inflacji z poprzedniego roku scenariusza, zamrożonej na okres. Deflacja daje zerową podstawę indeksacji plus marżę, ale obniża próg zachowania siły nabywczej.
- Poprawiono odczyt szeregu założeń (`??` zamiast `||`), aby jawne zero nie było zastępowane ostatnią wartością.

## UI, API i zapis założeń

- Początkowy HTML zawiera miesiąc, datę weryfikacji i źródło każdej serii. Poprawiono ROS = 6 lat oraz ROD = 12 lat w tabeli i legendzie. Wyjaśniono ograniczenie 800+ i przyszłe założenia.
- Formularz: 1–12 pełnych lat, 1–1 000 000 całkowitych sztuk. API: 1–144 całkowitych miesięcy, 1–12 wartości w każdej tablicy. Inflacja: −99–100%; NBP i gotówka: 0–100%. Błędne dane dają HTTP 400.
- `skipTax` jest przekazywany i stosowany; brak parametru zachowuje podatek. Przełącznik nie oznacza pełnej symulacji IKE/IKZE. WIBOR pozostaje opcjonalny i ignorowany dla starych klientów.
- localStorage ma `schemaVersion: 2`, `offerVersion` i `values`. Każde prawidłowe wcześniejsze założenie jest zachowywane; tylko wadliwe pola dostają default. Reset jest świadomą akcją.
- Domyślne scenariusze: inflacja 3,5%, NBP 4%, gotówka 0%. To założenia, nie prognoza. Naprawiono klasyfikację kolorów (rok nie jest inwestycją), nagłówki, przewijanie i opis dostępności wykresu.
- Zachowano endpoint i `data.values`. Dodano metadane `offerVersion` oraz `calculationVersion: 2`. Stary klient może je pominąć; nowy odrzuca niezgodną ofertę/metodę i wyświetla błąd. Oba buildy zawierają wersję i hash JSON.

## Niezależne przykłady

Zakup 01.10.2026, inflacja 3,5%, NBP 4%, gotówka 0%. Iloczyny obliczono niezależną arytmetyką dziesiętną według listów; nie skopiowano starych snapshotów.

| Przykład | Wynik |
| --- | --- |
| TOS po 36 miesiącach | 113,79 zł brutto, podane wprost w ust. 14 listu; 111,16 zł netto |
| 100 TOS po 36 miesiącach | 11 379 zł brutto; 11 116,99 zł netto od wspólnej wypłaty |
| TOS po 13 miesiącach, wcześniejszy wykup | N1 = 104,40 zł, 31/366 dni, opłata 1 zł; 103,79 zł brutto i 103,06 zł netto |
| EDO po 24 miesiącach, wcześniejszy wykup | 100 × 1,0535 × 1,055 − 3 zł; 108,14 zł brutto, 106,59 zł netto |
| EDO po 120 miesiącach | 100 × 1,0535 × 1,055^9; 170,57 zł brutto, 157,16 zł netto |
| ROS po 72 miesiącach | 100 × 1,05 × 1,055^5; 137,23 zł brutto, 130,15 zł netto |
| ROD po 144 miesiącach | 100 × 1,056 × 1,06^11; 200,46 zł brutto, 181,37 zł netto |

## Weryfikacja przed publikacją

- Functions: build, lint i 36/36 testów. Zakres: siedem typów, pierwsze/kolejne okresy, zapadalność/wcześniejszy wykup, podatek i opłaty, ACT/ACT/rok przestępny, inflacja/deflacja/zero, reinwestycja/gotówka, niezależność wyceny od horyzontu i HTTP.
- Frontend: 13/13 testów w 6 zestawach, w tym 7 nowych testów migracji, formularza, zakresów, resetu, `skipTax` i niezgodnej wersji API.
- Build produkcyjny: sześć prerenderowanych tras. Surowy HTML zawiera ofertę i siedem linków PDF; hashe obu buildów są zgodne. Build poza sandboxem przechodzi; ograniczony sandbox przerywał go bez diagnostyki.
- Emulator: `smoke:api -- --contracts` przechodzi dla czterech endpointów, HTTP 400 i CORS. `smoke:bonds` sprawdza przykłady, `skipTax`, wersję oferty i sześć błędnych żądań.
- Przegląd przeglądarkowy formularza, resetu, walidacji, oferty, wyników i wykresu: 390 × 844 i 1280 × 900 px. Brak poszerzenia dokumentu; tabele mają własne przewijanie. Brak błędów w konsoli badanej sesji.
- Pozostają wcześniejsze ostrzeżenia Browserslist, Lodash, `.tooltip:has()` i setupu Jest oraz ostrzeżenie Nx o `sourceRoot` Functions wynikające ze wspólnego JSON. Nie blokują buildu. Repozytoryjny formatter wymuszał parser Angular także na Markdown; format dokumentacji poprawiono przed publikacją.

## Granice modelu i publikacja

Wycena na miesięczne rocznice po kuponie, od pierwszego dnia miesiąca oferty. ACT/ACT obejmuje niepełne lata, ale nie przesuwamy dat o weekendy/święta, ustalanie praw czy pięć dni roboczych rozliczenia. To hipotetyczna wartość wcześniejszego wykupu, nie obietnica przelewu na dokładny dzień. Po wypłacie kuponu opłata może pomniejszyć nominał.

Przyszłe emisje powtarzają bieżące warunki jako założenie. Nie sprawdzamy indywidualnego limitu ROS/ROD ani pełnych zasad IKE/IKZE. OTS nie dodano.

[Checklista miesięczna](OBLIGACJE-AKTUALIZACJA-MIESIECZNA.md) opisuje aktualizację i weryfikację. Publikacja: najpierw Functions i kontrola API, następnie Hosting i kontrola UI. Po październiku oferta wymaga ponownej weryfikacji.
