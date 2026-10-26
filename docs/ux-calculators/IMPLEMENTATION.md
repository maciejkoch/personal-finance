# Implementacja zaakceptowanego UI kalkulatorów

26.10.2026 · branch `codex/calculators-ux-review`.

Późniejsza publikacja na polecenie użytkownika i kontrola produkcji: [PRODUCTION.md](PRODUCTION.md).

## Korekta po informacji zwrotnej — hero

Przywrócono wcześniejsze hero wszystkich trzech kalkulatorów: przycisk „Rozpocznij” zwija opis i po animacji przewija do głównych założeń; nagłówek pozwala ponownie rozwinąć opis. Nowy układ formularzy, paneli i wykresów pozostaje zachowany. Jawne polecenie zwinięcia nie otwiera już przypadkowo zamkniętego hero. Regresję działania przycisku i ponownego rozwijania pokrywają dwa testy. Po tej korekcie przechodzi 120/120 testów, lint, produkcyjny build i kontrola treści. Korektę wdrożono następnie na osobne polecenie użytkownika z commita `cd769fb`; szczegóły nowego wydania są w PRODUCTION.md.

## Zakres

Wszystkie trzy kalkulatory mają układ „Obok wyniku”: formularz po lewej, podsumowanie i główny wykres po prawej; poniżej 1024 px jedna kolumna. Zachowano istniejące menu aplikacji i motyw `pf`.

- Pola należą do wspólnych grup: założenia główne, dodatkowe, podatek/uprawnienia. Miesiąc oferty przeniesiono do głównych założeń obligacji. Podsumowania zamkniętych paneli odzwierciedlają aktualne ustawienia.
- Główne założenia, wynik i główny wykres są zawsze widoczne. Dodatkowe założenia oraz szczegóły, przebieg obligacji, warunki oferty i metodologia są domyślnie zwinięte. Podatek jest początkowo otwarty na desktopie i zwinięty na telefonie/tablecie.
- Niezależne panele zapamiętują świadomy wybór użytkownika w oddzielnej przestrzeni kluczy localStorage. Otwieranie panelu z błędem nie nadpisuje zapisanej preferencji.
- Błędy pozostają oparte na istniejącym Signal Forms; komunikaty pokazano przy odpowiednich polach, z powiązaniem `aria-describedby`. Błąd dodatkowego pola automatycznie ujawnia jego panel.
- Główny wynik jest wyraźną kwotą z krótkim kontekstem i dwoma parametrami pomocniczymi. Pełne rozliczenie zachowano w szczegółach. W obligacjach zachowano próg siły nabywczej i nadwyżkę/niedobór.
- Wykres końcowy obligacji ma poziome słupki i dokładne kwoty dostępne także bez hovera. Przebieg roczny zajmuje pełną szerokość w osobnym panelu; ma natywne checkboxy serii, odrębne wzory linii i widoczne punkty dla jednorocznego okresu.
- Wykres oszczędzania przedstawia kapitał początkowy, późniejsze wpłaty i zysk brutto jako skumulowane słupki, wraz z kolumną „Start”. Dane roczne pochodzą z istniejącej odpowiedzi; dostępny klawiaturą odczyt roku pokazuje dokładne wartości. Rozliczenie kapitału, wpłat, zysku i podatku pozostało w szczegółach.
- Na telefonie skróty „Zobacz wynik” i „Zmień założenia” przewijają stronę bez zmiany trasy. Link IKE prowadzi do pełnej, wspólnej metodologii i ujawnia jej panel.
- Pełne wzory, przykłady, ograniczenia i źródła są zachowane w HTML prerenderowanym; panele nie usuwają treści z dokumentu.

Nie zmieniano źródeł Functions, usług HTTP, store'ów obliczeniowych, walidatorów, modeli, kontraktów, parametrów ofert ani ustawień App Check. Nie wdrażano aplikacji na produkcję.

## Weryfikacja

- `npm test`: **118/118**, 25 plików testowych. Istniejące regresje HTTP, formularzy i zgodności wyników obligacji przechodzą.
- Nowe testy obejmują: stany paneli na mobile/desktopie, przywracanie preferencji, niezależne otwieranie, ujawnianie błędnych pól, ukrywanie serii bez zmiany wartości, jednoroczny punkt i odczyt brutto/wpłat po zmianie okresu.
- `npm run lint`: bez błędów i ostrzeżeń.
- `NG_BUILD_MAX_WORKERS=2 npm run build -- --stats-json --progress=false`: produkcyjny build i prerender ośmiu tras. Build wykonano poza sandboxem, który przerywał proces budowania.
- `npm run check:content`: wszystkie osiem stron, metodologia bez JavaScript, daty, linki, zgodność artykułów i brak Marked w JS przeglądarki.
- `git diff --check`: bez błędów.

Kontrola w działającej przeglądarce: desktop 1280 px, tablet 768 px oraz telefony 390 i 320 px; brak poziomego overflow strony. Sprawdzono menu boczne, główne wyniki, wykresy, wybór serii i roku, skróty przewijania, otwieranie pomocy IKE i cel pokryty kapitałem. Nie był to pełny test czytnikiem ekranu.

Produkcyjne API z aktywnym App Check odrzucało lokalny podgląd. Do odbioru wizualnego uruchomiono tymczasowy serwer na loopback, wywołujący istniejące skompilowane funkcje obliczeniowe i podający ofertę październikową z repo pod testowym identyfikatorem zgodnym z formatem publikacji. Serwer nie łączy się z Firestore i nie zapisuje danych. Jest wyłącznie narzędziem lokalnego odbioru; jego kod i testowy identyfikator nie są częścią aplikacji ani zmian backendu.

Zrzuty z tego lokalnego odbioru:

- [Obligacje — desktop](desktop-bonds.png)
- [Obligacje — telefon](mobile-bonds.png)
- [Regularne oszczędzanie — desktop](desktop-regular.png)

Źródła decyzji projektowych i wcześniejsze mockupy są w [REVIEW.md](REVIEW.md).

## Korekty po odbiorze — 26.10.2026

- W celu długoterminowym i regularnym oszczędzaniu wykres liniowy zastąpiono skumulowanymi słupkami. Kapitał początkowy ma własny kolor i stałą wysokość w każdym roku; wpłaty i zysk brutto stanowią pozostałe warstwy. Kolumna „Start” oraz odczyt roku zerowego pokazują sam kapitał początkowy. Wyłączono animację słupków, aby nowe wyniki i zmiany rozmiaru były widoczne od razu.
- Hero współdzieli stan w obrębie sekcji kalkulatorów. Po „Rozpocznij” pozostaje zwinięte przy zmianie kalkulatora; ręczne rozwinięcie także obowiązuje na kolejnych trasach. Nowe wejście do sekcji lub przeładowanie strony zaczyna od rozwiniętego hero. Opóźniony scroll jest anulowany przy opuszczeniu strony.
- We wszystkich trzech formularzach nagłówek „Założenia główne” wyrównano z „Twój wynik”, a górną krawędź głównego fieldsetu z kartą wyniku. Usunięto stałą pustą przestrzeń z nieaktywnego komunikatu ładowania; komunikaty nadal są dostępne w live region.
- Kontrola w przeglądarce: wszystkie trzy trasy, nawigacja ze zwiniętym i rozwiniętym hero, odczyt „Start”, telefony 390 i 320 px bez poziomego overflow po zakończeniu zmiany rozmiaru. Zweryfikowano też cel pokryty samym kapitałem początkowym.
- Weryfikacja: **123/123 testy, 27 plików**, lint, produkcyjny build, prerender ośmiu tras i kontrola treści. Logika obliczeń i backend pozostają bez zmian. Ta korekta nie została jeszcze wdrożona na produkcję.

Zrzuty po korekcie: [wyrównanie obligacji](aligned-bonds-desktop.png), [wykres na desktopie](stacked-savings-desktop.png), [wykres na telefonie](stacked-savings-mobile.png).
