# Cineclub

Catálogo de películas y series con datos de TMDB.

## Desarrollo local

1. Copia `.env.example` a `.env.local`.
2. Sustituye `your_tmdb_api_key_here` por tu clave API v3 de TMDB.
3. Ejecuta `npm install` y `npm run dev`.

## Publicar en Netlify

El archivo `netlify.toml` configura `npm run build`, publica la carpeta `dist` y habilita la ruta de respaldo de la aplicación.

1. Abre tu sitio en Netlify y ve a **Site Settings → Environment Variables → Add Variable** (en la interfaz actual también puede aparecer como **Site configuration → Environment variables**).
2. Crea la variable con estos valores:

   **Key:** `VITE_TMDB_API_KEY`  
   **Value:** `TU_API_KEY_DE_TMDB`

3. Guarda los cambios y ve a **Deploys → Trigger deploy → Clear cache and deploy site**. Vite incorpora las variables `VITE_*` durante la compilación; guardar la variable no cambia un despliegue existente.
4. Si utilizas Deploy Previews, configura también el valor en ese contexto.

La aplicación consulta TMDB directamente desde el navegador. Vite incorpora las variables `VITE_*` en el código del cliente durante la compilación, así que `VITE_TMDB_API_KEY` será visible para quienes visiten el sitio. Usa únicamente una clave pública de lectura; no pongas credenciales privadas ni claves con permisos de escritura en variables `VITE_*`.
