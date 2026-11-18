# Interaktiv kastparabel

En liten webbsida för att undersöka kaströrelse. Den har ett rutnät, graderade axlar, reglage för fart och vinkel samt en tecknad hamster som kan spelas upp längs kastbanan. Hastighetsvektorn v och komponenterna vx och vy visas i olika färger. Den använder bara vanliga HTML-, CSS- och JavaScript-filer: inga paket, installationer eller byggsteg behövs.

## Öppna sidan

Öppna `index.html` i en webbläsare. Du kan också öppna projektmappen i VS Code och dubbelklicka på `index.html` därifrån.

## Ändra innehåll

- **Undervisningstexter, formler och reglage:** ändra texten och start-/min-/maxvärdena i `content.js`.
- **Tyngdacceleration och fysikberäkningar:** ändra `gravity` och formlerna i `physics.js`. Värdet på g som visas på sidan hämtas från samma fil.
- **Utseende:** ändra `styles.css`.
- `app.js` kopplar ihop filerna och ritar grafen. Du behöver normalt inte ändra den.
- `index.html` innehåller sidans struktur och laddar de andra filerna.

Efter en ändring sparar du filen och laddar om sidan i webbläsaren.

## Publicera med GitHub Pages

Lägg hela projektmappen i ett GitHub-repository. Välj sedan **Settings → Pages** i repositoryt. Under **Build and deployment** väljer du **Deploy from a branch**, grenen `main` och mappen `/(root)`, och sparar. När GitHub Pages har publicerat sidan visas länken på samma inställningssida.
