# INCH · Carta digital

**Para retomar el trabajo, leer primero [CLOUDFLARE.md](CLOUDFLARE.md).** Estado vigente al 29/10/2026: prueba Cloudflare Pages + D1 con panel editable, fotos, borradores y publicación. El trabajo de conexión PostgreSQL Netlify se detuvo. [RETOMAR-MANANA.md](RETOMAR-MANANA.md) conserva el contexto anterior.

- Prueba de carta: https://inch-carta-demo.pages.dev/
- Administrador: https://inch-carta-demo.pages.dev/admin
- Desarrollo Cloudflare: `npm run build:cloudflare` y `npm run dev:cloudflare` (puerto 8788).

- Carpeta: `C:/Users/Usuario/Desktop/Restaurantes`.
- GitHub: https://github.com/jonycusac-bot/restaurantes/tree/feat/bootstrap
- Carta: https://restaurant-management-82d26f.netlify.app/
- Panel: https://restaurant-management-82d26f.netlify.app/admin
- Historial ampliado: [INCH.md](INCH.md).
- Fotos, capturas y fuentes: [design/inch/README.md](design/inch/README.md).

La carta y el panel privado están publicados. PostgreSQL Netlify ya está creado en plan Free, pero todavía no está conectado al panel. Los borradores siguen en el navegador; «Publicar cambios» está deshabilitado. Credenciales y respuestas privadas permanecen solo en el PC y Netlify, fuera de GitHub.

Publicación vigente: `npm run build:inch` y Netlify CLI **incluyendo funciones**; consultar el documento de continuación. El ZIP histórico y el build general Next no son el procedimiento actual.

## Instrucciones originales de Next.js (referencia del arranque)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
