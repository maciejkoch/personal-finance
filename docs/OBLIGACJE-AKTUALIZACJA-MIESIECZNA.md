# Miesięczna aktualizacja oferty obligacji

Jedynym źródłem danych UI, Functions i metadanych jest `functions/src/treasury-bonds/treasury-bonds.offer.json`. Zwykła zmiana stawek nie wymaga zmiany algorytmu; nowe zasady naliczania wymagają osobnej zmiany i testów.

1. Ustal miesiąc **wdrożenia**, nie tylko przygotowania. Na przełomie miesiąca zweryfikuj ofertę ponownie.
2. Pobierz siedem listów z [oficjalnego serwisu](https://www.obligacjeskarbowe.pl/listy-emisyjne/). Sprawdź serię, datę listu i okres sprzedaży wewnątrz PDF. Komunikat prasowy jest kontrolą pomocniczą.
3. Sprawdź pierwszą stopę i okres, marżę, indeksację i dolną granicę, wypłatę/kapitalizację, zapadalność, zamianę, opłatę i ochronę nominału, uprawnienia rodzinne i terminy dyspozycji/rozliczenia.
4. Aktualizuj `version` (np. `2026-11-v1`), `month`, `label`, `verifiedAt`, `saleFrom`, `saleTo` i siedem serii w JSON. Zachowaj linki do konkretnych PDF. Nie dodawaj dyskonta rodzinnego bez potwierdzenia.
5. Zachowaj prawidłowe założenia użytkownika. Defaulty w `treasury-bonds-form-state.ts` są scenariuszami, nie prognozą. Reset musi być świadomą akcją.
6. Zapisz numery listów i SHA-256 PDF w `docs/baseline`. Przygotuj niezależne przykłady pierwszego/kolejnego okresu, wykupu, wcześniejszego zakończenia i podatku. Zaktualizuj testy i przykłady w `scripts/smoke-bonds.mjs` według załączników, nie wyniku starego kodu.
7. Uruchom `npm run test:functions`, `npm --prefix functions run lint`, `npm run build:functions`, `npm test` i `npm run build`. Sprawdź wersje i hashe oferty obu buildów. Prerender może wymagać uruchomienia poza ograniczonym sandboxem.
8. Emulator: `npm run smoke:api -- --contracts` oraz `npm run smoke:bonds`. UI desktop/mobile: miesiąc, źródła, formularz, reset, podatek, błędy, tabela, legenda, wykres i niezgodna wersja API.
9. Oddaj konkretną zmianę do przeglądu. Bez wyraźnego polecenia nie wykonuj commita, push ani deploya. Automatyzacja może przygotować propozycję, ale nie publikować niezweryfikowanych liczb.
10. Po zatwierdzeniu: najpierw Functions, kontrola API/metadanych, potem Hosting. Nowy klient wymaga zgodnego `offerVersion` i `calculationVersion: 2`; starego kontraktu `data.values` nie usuwamy. Po publikacji `npm run smoke:bonds -- --production`, kontrola UI i zapis wersji wydania.

## Model i ograniczenia

Zakup pierwszego dnia miesiąca oferty, wycena po kuponach na miesięczne rocznice, roczna kapitalizacja i ACT/ACT dla niepełnych lat. Kwoty świadczeń zaokrąglamy na jedną obligację, podatek od wspólnej wypłaty w górę do grosza. Rozbicie dyspozycji może zmienić zaokrąglenia.

Ponowny zakup zakłada dzisiejsze warunki przyszłych emisji. Wykup i ostatni kupon używają ceny zamiany; wcześniejsze kupony i gotówka ceny 100 zł. Reszta pracuje przy założonej stopie, z miesięcznym podatkiem. Nie dodajemy wpłat ani zakupu po końcowej wycenie.

Wcześniejszy wykup jest hipotetyczną wyceną. Nie uwzględniamy weekendów/świąt, dat ustalania praw, pięciu dni roboczych rozliczenia i okna dyspozycji (po 7 dniach zakupu, najpóźniej 20 dni przed zapadalnością). Ograniczenia są w opisie i danych emisji. Nie sprawdzamy indywidualnego limitu rodzinnego ani pełnych zasad i kosztów IKE/IKZE.
