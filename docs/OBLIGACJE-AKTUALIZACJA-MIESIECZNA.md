# Miesięczna aktualizacja oferty obligacji

Po wdrożeniu obsługi dynamicznych ofert źródłem UI i nowego kontraktu API v4 jest Firestore. Harmonogram sprawdza oficjalne listy codziennie o 08:00 i 20:00 czasu Warszawy. Kompletna, rozpoznana oferta jest zapisywana jako niezmienna wersja; zwykła zmiana stawek nie wymaga deploya. Nowe zasady naliczania wymagają osobnej zmiany i testów. Statyczny `treasury-bonds.offer.json` pozostaje ofertą startową i źródłem kompatybilności starych klientów.

Pełna procedura konfiguracji, włączenia harmonogramu, migracji do Warszawy, ręcznych importów, korekt i rollbacku: [Automatyczne oferty — wdrożenie](OBLIGACJE-AUTOMATYCZNE-WDROZENIE.md).

1. Kontrolować błędy importera i kompletność bieżącej oferty; brak kolejnego miesiąca przed publikacją jest normalny.
2. Gdy importer odrzuci nowe warunki, sprawdzić siedem źródłowych listów. Zweryfikować stopy, marże, opłaty, okresy, kapitalizację, ochronę nominału, uprawnienia rodzinne oraz terminy dyspozycji i rozliczenia.
3. Aktualizować parser lub model tylko po weryfikacji dokumentów. Zachować źródła i SHA-256. Nie nadpisywać wcześniejszej oferty — publikować nową wersję.
4. Uruchomić testy backendu, Angulara, emulatora oraz build i testy smoke. Dla zmian algorytmu przygotować niezależne wartości oczekiwane.
5. W razie błędnej publikacji aktywować poprzednią poprawną wersję i wycofać błędną. Nie usuwać historii.

## Model i ograniczenia

Zakup pierwszego dnia miesiąca wybranej oferty, wycena po kuponach na miesięczne rocznice, roczna kapitalizacja i ACT/ACT dla niepełnych lat. Kwoty świadczeń zaokrąglamy na jedną obligację, podatek od wspólnej wypłaty w górę do grosza. Rozbicie dyspozycji może zmienić zaokrąglenia.

Ponowny zakup zakłada warunki wybranej oferty również dla przyszłych emisji. Wykup i ostatni kupon używają ceny zamiany; wcześniejsze kupony i gotówka ceny 100 zł. Reszta pracuje przy założonej stopie, z miesięcznym podatkiem. Nie dodajemy wpłat ani zakupu po końcowej wycenie.

Wcześniejszy wykup jest hipotetyczną wyceną. Nie uwzględniamy weekendów/świąt, dat ustalania praw, pięciu dni roboczych rozliczenia i okna dyspozycji. Ograniczenia są w opisie i danych emisji. Nie sprawdzamy indywidualnego limitu rodzinnego ani pełnych zasad i kosztów IKE/IKZE. Wybór historycznej emisji nie pobiera historycznych stóp NBP i inflacji; zachowuje scenariusze użytkownika. OTS nie jest obsługiwane.
