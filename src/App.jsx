import { useEffect, useState } from 'react'
import './App.css'

const API_ROOT = 'https://api.themoviedb.org/3'
const IMAGE_ROOT = 'https://image.tmdb.org/t/p'
const apiKey = import.meta.env.VITE_TMDB_API_KEY
const API_KEY_MISSING_MESSAGE = 'VITE_TMDB_API_KEY no configurada. Añádela en Netlify o en tu archivo .env'

const shelves = [
  { key: 'trending', title: 'Tendencias de la semana', path: '/trending/movie/week?language=es-MX' },
  { key: 'popular', title: 'Las más populares', path: '/movie/popular?language=es-MX' },
  { key: 'topRated', title: 'Favoritas de todos los tiempos', path: '/movie/top_rated?language=es-MX' },
  { key: 'nowPlaying', title: 'Ahora en cines', path: '/movie/now_playing?language=es-MX' },
  { key: 'upcoming', title: 'Próximos estrenos', path: '/movie/upcoming?language=es-MX' },
  { key: 'nature', title: 'Naturaleza y grandes documentales', path: '/discover/movie?language=es-MX&with_genres=99&with_keywords=9902%7C221355%7C18330%7C18165&sort_by=popularity.desc&vote_count.gte=3' },
  { key: 'animalPlanet', title: 'Animal Planet', path: '/discover/tv?language=es-MX&with_networks=91&sort_by=popularity.desc', mediaType: 'tv' },
  { key: 'wildlifeChannels', title: 'National Geographic y Discovery', path: '/discover/tv?language=es-MX&with_networks=43%7C64&sort_by=popularity.desc', mediaType: 'tv' },
]

function Icon({ name, size = 20 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></>,
    play: <path d="m8 5 12 7-12 7z" fill="currentColor" stroke="none" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
    left: <path d="m15 18-6-6 6-6" />,
    right: <path d="m9 18 6-6-6-6" />,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function imageUrl(path, size = 'w500') {
  return path ? `${IMAGE_ROOT}/${size}${path}` : ''
}

function MovieCard({ movie, rank, onOpen, isSaved, onToggleSave }) {
  const title = movie.title || movie.name
  const year = (movie.release_date || movie.first_air_date || '').slice(0, 4)

  return (
    <article className={`movie-card${rank ? ' ranked-card' : ''}`}>
      {rank && <span className="movie-rank">{rank}</span>}
      <button
        className="poster-button"
        type="button"
        onClick={() => onOpen(movie)}
        aria-label={`Ver detalles de ${title}`}
      >
        {movie.poster_path ? (
          <img className="movie-poster" src={imageUrl(movie.poster_path)} alt={`Póster de ${title}`} loading="lazy" />
        ) : (
          <span className="poster-fallback">{title}</span>
        )}
        <span className="poster-shade" />
        <span className="poster-play"><Icon name="play" size={18} /></span>
        <span className="poster-meta">
          <strong>{title}</strong>
          <span>{year} <span className="meta-dot">·</span> ★ {movie.vote_average?.toFixed(1) || '—'}</span>
        </span>
      </button>
      <button
        className={`save-button${isSaved ? ' is-saved' : ''}`}
        type="button"
        onClick={() => onToggleSave(movie)}
        aria-label={isSaved ? `Quitar ${title} de mi lista` : `Añadir ${title} a mi lista`}
        title={isSaved ? 'Quitar de Mi lista' : 'Añadir a Mi lista'}
      >
        <Icon name={isSaved ? 'check' : 'plus'} size={17} />
      </button>
    </article>
  )
}

function MovieShelf({ title, movies, onOpen, savedIds, onToggleSave, loading, rank = false, id }) {
  const [offset, setOffset] = useState(0)
  const visibleMovies = movies.slice(offset, offset + 6)

  if (!loading && movies.length === 0) return null

  return (
    <section className="shelf" id={id}>
      <div className="shelf-heading">
        <h2>{title}</h2>
        <div className="shelf-controls">
          <span className="shelf-count">{loading ? 'Cargando…' : `${movies.length} títulos`}</span>
          <button
            type="button"
            className="arrow-button"
            aria-label={`Películas anteriores de ${title}`}
            onClick={() => setOffset(Math.max(0, offset - 6))}
            disabled={offset === 0}
          ><Icon name="left" size={17} /></button>
          <button
            type="button"
            className="arrow-button"
            aria-label={`Más películas de ${title}`}
            onClick={() => setOffset(offset + 6 >= movies.length ? 0 : offset + 6)}
            disabled={movies.length <= 6}
          ><Icon name="right" size={17} /></button>
        </div>
      </div>
      {loading ? (
        <div className="movie-grid">
          {Array.from({ length: 6 }, (_, index) => <div className="skeleton-poster" key={index} />)}
        </div>
      ) : (
        <div className="movie-grid">
          {visibleMovies.map((movie, index) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              rank={rank ? offset + index + 1 : null}
              onOpen={onOpen}
              isSaved={savedIds.includes(movie.id)}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function App() {
  const [collections, setCollections] = useState({})
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(Boolean(apiKey))
  const [error, setError] = useState(apiKey ? '' : API_KEY_MISSING_MESSAGE)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [savedMovies, setSavedMovies] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cineclub-watchlist') || '[]')
    } catch {
      return []
    }
  })
  const [showSaved, setShowSaved] = useState(false)
  const [activeGenre, setActiveGenre] = useState(null)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [movieDetails, setMovieDetails] = useState(null)
  const [trailer, setTrailer] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!apiKey) {
      return
    }

    const controller = new AbortController()
    async function loadCatalog() {
      try {
        const [genreData, ...catalogs] = await Promise.all([
          request('/genre/movie/list?language=es-MX', controller.signal),
          ...shelves.map((shelf) => request(shelf.path, controller.signal)),
        ])
        setGenres(genreData.genres || [])
        setCollections(Object.fromEntries(shelves.map((shelf, index) => [
          shelf.key,
          (catalogs[index].results || []).map((item) => ({
            ...item,
            media_type: shelf.mediaType || 'movie',
          })),
        ])))
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }

    loadCatalog()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    localStorage.setItem('cineclub-watchlist', JSON.stringify(savedMovies))
  }, [savedMovies])

  async function request(path, signal) {
    if (!apiKey) {
      throw new Error(API_KEY_MISSING_MESSAGE)
    }

    const url = new URL(`${API_ROOT}${path}`)
    url.searchParams.set('api_key', apiKey)

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal,
    })
    if (!response.ok) {
      if (response.status === 401) throw new Error('TMDB rechazó la credencial. Comprueba que el token sea válido y vuelve a cargar la página.')
      if (response.status === 429) throw new Error('TMDB recibió demasiadas solicitudes. Espera un momento y vuelve a intentarlo.')
      throw new Error(`No se pudo cargar el catálogo de TMDB (error ${response.status}).`)
    }
    return response.json()
  }

  async function handleSearch(event) {
    event.preventDefault()
    const query = search.trim()
    if (!query) {
      setSearchResults(null)
      return
    }

    setSearching(true)
    setError('')
    try {
      const results = await request(`/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=es-MX`)
      setSearchResults(results.results || [])
      setActiveGenre(null)
      setShowSaved(false)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSearching(false)
    }
  }

  function toggleSaved(movie) {
    setSavedMovies((current) => current.some((item) => item.id === movie.id)
      ? current.filter((item) => item.id !== movie.id)
      : [...current, movie])
  }

  async function openMovie(movie) {
    const mediaType = movie.media_type === 'tv' ? 'tv' : 'movie'
    setSelectedMovie(movie)
    setMovieDetails(null)
    setTrailer('')
    setDetailLoading(true)
    try {
      const [details, videos] = await Promise.all([
        request(`/${mediaType}/${movie.id}?language=es-MX`),
        request(`/${mediaType}/${movie.id}/videos?language=es-MX`),
      ])
      setMovieDetails(details)
      const video = videos.results?.find((item) => item.site === 'YouTube' && item.type === 'Trailer')
        || videos.results?.find((item) => item.site === 'YouTube')
      if (video) setTrailer(video.key)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDetailLoading(false)
    }
  }

  const featuredMovie = collections.trending?.[0]
  const currentMovies = showSaved
    ? savedMovies
    : activeGenre
      ? Object.values(collections).flat().filter((movie, index, list) =>
        movie.genre_ids?.includes(activeGenre) && list.findIndex((item) => item.id === movie.id) === index)
      : searchResults

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Cineclub, inicio">
          <span className="brand-mark">C</span><span>CINE<span className="brand-light">CLUB</span></span>
        </a>
        <button className="mobile-menu-button" type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Abrir navegación">
          <Icon name="menu" />
        </button>
        <nav className={`main-nav${mobileMenuOpen ? ' nav-open' : ''}`} aria-label="Navegación principal">
          <a className={!showSaved && !activeGenre ? 'nav-active' : ''} href="#inicio" onClick={() => { setShowSaved(false); setActiveGenre(null); setSearchResults(null); setMobileMenuOpen(false) }}>Inicio</a>
          <a href="#peliculas" onClick={() => { setShowSaved(false); setActiveGenre(null); setMobileMenuOpen(false) }}>Películas</a>
          <button type="button" className={showSaved ? 'nav-active' : ''} onClick={() => { setShowSaved(true); setActiveGenre(null); setSearchResults(null); setMobileMenuOpen(false) }}>Mi lista <span className="list-count">{savedMovies.length}</span></button>
        </nav>
        <div className="topbar-actions">
          <form className="search-form" onSubmit={handleSearch} role="search">
            <Icon name="search" size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar película..." aria-label="Buscar películas" />
            {search && <button type="button" className="clear-search" onClick={() => { setSearch(''); setSearchResults(null) }} aria-label="Limpiar búsqueda"><Icon name="close" size={16} /></button>}
          </form>
          <span className="profile-avatar" aria-label="Tu perfil">C</span>
        </div>
      </header>

      <main>
        {error && <div className="notice" role="alert"><Icon name="info" size={19} /><span>{error}</span></div>}

        {!showSaved && !activeGenre && !searchResults && featuredMovie && (
          <section className="feature" id="inicio" style={{ '--feature-image': `url("${imageUrl(featuredMovie.backdrop_path, 'original')}")` }}>
            <div className="feature-content">
              <span className="eyebrow"><span className="live-dot" /> LO MÁS VISTO ESTA SEMANA</span>
              <p className="feature-kicker">LA ELECCIÓN DE CINECLUB</p>
              <h1>{featuredMovie.title}</h1>
              <div className="feature-facts">
                <span className="rating-badge">★ {featuredMovie.vote_average?.toFixed(1)}</span>
                <span>{(featuredMovie.release_date || '').slice(0, 4)}</span>
                <span className="age-badge">TOP 10</span>
                <span>Película</span>
              </div>
              <p className="feature-overview">{featuredMovie.overview || 'Una película que está dando de qué hablar. Descubre todos los detalles en Cineclub.'}</p>
              <div className="feature-actions">
                <button className="button button-primary" type="button" onClick={() => openMovie(featuredMovie)}><Icon name="play" size={19} /> Ver detalles</button>
                <button className="button button-glass" type="button" onClick={() => openMovie(featuredMovie)}><Icon name="info" size={19} /> Más información</button>
              </div>
            </div>
            <div className="feature-index"><span>01</span> / 05</div>
            <div className="feature-gradient" />
          </section>
        )}

        <div className="content-area" id="peliculas">
          <div className="genre-bar">
            <div className="genre-intro">
              <span className="eyebrow">EXPLORA</span>
              <h2>¿Qué te apetece ver?</h2>
            </div>
            <div className="genre-chips">
              <button type="button" className={!activeGenre && !showSaved && !searchResults ? 'genre-chip selected' : 'genre-chip'} onClick={() => { setActiveGenre(null); setShowSaved(false); setSearchResults(null) }}>Todo</button>
              {genres.slice(0, 9).map((genre) => (
                <button type="button" key={genre.id} className={activeGenre === genre.id ? 'genre-chip selected' : 'genre-chip'} onClick={() => { setActiveGenre(genre.id); setShowSaved(false); setSearchResults(null) }}>{genre.name}</button>
              ))}
            </div>
          </div>

          {(searchResults || showSaved || activeGenre) ? (
            <section className="results-section">
              <div className="results-title">
                <div>
                  <span className="eyebrow">{showSaved ? 'TU COLECCIÓN' : activeGenre ? 'POR CATEGORÍA' : 'RESULTADOS'}</span>
                  <h2>{showSaved ? 'Mi lista' : activeGenre ? genres.find((genre) => genre.id === activeGenre)?.name : `Resultados para “${search}”`}</h2>
                </div>
                {(searching || loading) && <span className="loading-label">Cargando películas…</span>}
              </div>
              {currentMovies?.length ? (
                <div className="results-grid">
                  {currentMovies.map((movie) => <MovieCard key={movie.id} movie={movie} onOpen={openMovie} isSaved={savedMovies.some((item) => item.id === movie.id)} onToggleSave={toggleSaved} />)}
                </div>
              ) : (
                <div className="empty-state"><span className="empty-icon">✦</span><h3>{showSaved ? 'Tu lista empieza aquí' : 'Todavía no hay resultados'}</h3><p>{showSaved ? 'Guarda las películas que quieras ver para encontrarlas aquí.' : 'Prueba con otro título o explora una categoría diferente.'}</p></div>
              )}
            </section>
          ) : (
            <div className="shelves">
              {shelves.map((shelf) => (
                <MovieShelf
                  key={shelf.key}
                  id={shelf.key === 'trending' ? 'tendencias' : undefined}
                  title={shelf.title}
                  movies={collections[shelf.key] || []}
                  loading={loading}
                  rank={shelf.key === 'popular'}
                  onOpen={openMovie}
                  savedIds={savedMovies.map((movie) => movie.id)}
                  onToggleSave={toggleSaved}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#inicio"><span className="brand-mark">C</span><span>CINE<span className="brand-light">CLUB</span></span></a>
        <p>Tu próxima historia favorita está aquí.</p>
        <span className="tmdb-credit">Datos de películas proporcionados por TMDB</span>
        <span className="copyright">© 2026 Cineclub</span>
      </footer>

      {selectedMovie && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedMovie(null) }}>
          <section className="movie-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button type="button" className="modal-close" onClick={() => setSelectedMovie(null)} aria-label="Cerrar"><Icon name="close" size={21} /></button>
            {trailer ? (
              <div className="trailer-wrap"><iframe src={`https://www.youtube-nocookie.com/embed/${trailer}`} title={`Tráiler de ${selectedMovie.title}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
            ) : (
              <div className="modal-backdrop-image" style={{ backgroundImage: `linear-gradient(0deg,#15151a 0%,transparent 100%), url("${imageUrl(selectedMovie.backdrop_path, 'w1280')}")` }} />
            )}
            <div className="modal-body">
              <span className="eyebrow">{detailLoading ? 'CARGANDO DETALLES' : 'DESCUBRE TU PRÓXIMA PELÍCULA'}</span>
              <h2 id="modal-title">{movieDetails?.title || movieDetails?.name || selectedMovie.title || selectedMovie.name}</h2>
              <div className="feature-facts">
                <span className="rating-badge">★ {(movieDetails?.vote_average || selectedMovie.vote_average)?.toFixed(1)}</span>
                <span>{(movieDetails?.release_date || selectedMovie.release_date || '').slice(0, 4)}</span>
                {movieDetails?.runtime > 0 && <span>{Math.floor(movieDetails.runtime / 60)} h {movieDetails.runtime % 60} min</span>}
                {movieDetails?.genres?.slice(0, 2).map((genre) => <span key={genre.id}>{genre.name}</span>)}
              </div>
              <p>{movieDetails?.overview || selectedMovie.overview || 'Sinopsis no disponible.'}</p>
              <button className={`button ${savedMovies.some((item) => item.id === selectedMovie.id) ? 'button-glass' : 'button-primary'}`} type="button" onClick={() => toggleSaved(movieDetails || selectedMovie)}>
                <Icon name={savedMovies.some((item) => item.id === selectedMovie.id) ? 'check' : 'plus'} size={18} />
                {savedMovies.some((item) => item.id === selectedMovie.id) ? 'En mi lista' : 'Añadir a Mi lista'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
