# Kalkulator FIRE — 26.10.2026

Gałąź: `codex/fire-calculator`, baza: `e0afb123ef987a327e1afa66484a57b57b87c365` (aktualna produkcja).

## Plan i realizacja

1. Niezależny, leniwie ładowany kalkulator `/kalkulatory/fire`, obliczany lokalnie, bez nowego API.
2. Wejścia: wiek, zainwestowany kapitał, miesięczna wpłata, miesięczne wydatki na FIRE, efektywna roczna stopa zwrotu netto, inflacja i początkowa stopa wypłat.
3. Wyniki: cel kapitałowy, pierwszy miesiąc osiągnięcia celu, wiek, luka kapitałowa, postęp, realny zwrot, wykres SVG i dostępna tabela. Stan dla celu osiągniętego i nieosiągniętego w 100 lat.
4. Signal Forms, limity i komunikaty walidacji. Nieprawidłowe dane usuwają wynik. Reset przywraca przykład.
5. Linki w menu i na stronie głównej, SEO, sitemap, prerendering metodologii i wyników.
6. Testy modelu i formularza, lint, build produkcyjny, kontrola treści i produkcyjny smoke test po publikacji.

## Założenia

Wszystkie kwoty mają stałą siłę nabywczą. Nominalne wpłaty rosną wraz z inflacją. Realna stopa roczna jest obliczana jako iloraz czynników wzrostu netto i inflacji, miesięczna przez pierwiastek dwunastego stopnia. Wpłaty na koniec miesiąca. Cel = roczne wydatki / stopa wypłat. Zwrot po kosztach i podatkach w akumulacji; wydatki powinny obejmować rezerwę na podatki przy wypłatach.

Nie symulujemy okresu wypłat ani prawdopodobieństwa sukcesu. Model nie uwzględnia ZUS, zmienności, kolejności zwrotów i zmian wydatków. Domyślne 3,5% to edytowalny przykład. Kontekst stopy wypłat: https://www.morningstar.com/retirement/how-much-can-you-safely-withdraw-if-you-retire-early.

## Kontrole lokalne

- 131/131 testów frontendowych (w tym 7 testów modelu FIRE i test formularza z rzeczywistym zdarzeniem input, błędnym polem i resetem).
- Lint bez błędów.
- Build produkcyjny: 9 tras statycznych, FIRE ładowany leniwie.
- Dodatkowa kontrola metodologii, dat, danych strukturalnych i linków przez `check:content`.

## Punkt przywrócenia

Odczytano aktualny kanał live przed publikacją:
- Hosting version: `89ccf29bb2e79282`.
- Release: `1793030409551000`.
- Frontend build: `e0afb12-2026-10-26T15:59:32.999Z`, czysty commit bazowy.

Publikacja obejmuje wyłącznie Hosting, z weryfikacją TLS. Przywrócenie przez historię wydań Firebase Hosting do powyższej wersji.
