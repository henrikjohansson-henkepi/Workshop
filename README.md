# Andra ordningens differentialekvationer by Henke

En interaktiv webbsida för att undersöka differentialekvationer av formen

`y″ + ay′ + by = f(x)`

Ange koefficienterna `a` och `b`, funktionen `f(x)` samt begynnelsevillkoren
`y(0)` och `y′(0)`. Sidan visar en sluten lösning för polynom, exponential-
och sinus-/cosinusfunktioner samt ritar lösningens kurva för `0 ≤ x ≤ 20`.
Den anger även om systemet har resonans, dämpad svängning eller kritisk
dämpning.

## Öppna sidan

Öppna `index.html` i en webbläsare. Inga paket, installationer eller byggsteg
behövs.

## Funktioner i f(x)

Skriv en summa av tal, polynom, `sin(k*x)`, `cos(k*x)` och `exp(k*x)`.
Exempel: `sin(x)`, `x^2 + 2*x + 1` och `exp(-x)`. Multiplikation skrivs med
`*`. Andra funktioner eller uttryck som inte stöds ger ett tydligt fel i stället
för att visa en numerisk approximation som om den vore en sluten lösning.

## Filer

- `index.html` innehåller sidans struktur och inmatningsfält.
- `app.js` hanterar inmatning, visar den slutna lösningen och ritar grafen.
- `physics.js` tolkar de stödda funktionerna och bygger lösningen.
- `content.js` innehåller sidans texter.
- `styles.css` styr utseendet.

## Publicera med GitHub Pages

Lägg projektmappen i ett GitHub-repository. Välj **Settings → Pages** i
repositoryt. Under **Build and deployment** väljer du **Deploy from a branch**,
grenen `main` och mappen `/(root)`, och sparar.
