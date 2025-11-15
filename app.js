// Simple React app to fetch and display trending games
const { useState, useEffect, useCallback } = React;

function App() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('gameFavorites');
        return saved ? JSON.parse(saved) : [];
    });
    const [mostPopularGameId, setMostPopularGameId] = useState(null);
    const API_KEY = 'c6ea97e599bf40d2b865a7bef250bc6c';

    const computeMostPopular = (gamesList) => {
        if (!gamesList || gamesList.length === 0) return null;
        return gamesList.reduce((best, g) => {
            if (!best) return g;
            const a = (g.ratings_count || 0);
            const b = (best.ratings_count || 0);
            if (a > b) return g;
            if (a === b) {
                if ((g.rating || 0) > (best.rating || 0)) return g;
                return best;
            }
            return best;
        }, null);
    };

    const loadMoreGames = useCallback(() => {
        if (isLoadingMore || !hasMore || search) return;
        
        setIsLoadingMore(true);
        const nextPage = page + 1;
        const API_URL = `https://api.rawg.io/api/games?key=${API_KEY}&page=${nextPage}&page_size=40`;
        
        fetch(API_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch games');
                }
                return response.json();
            })
            .then(data => {
                if (data.results && data.results.length > 0) {
                    setGames(prev => {
                        const existingIds = new Set(prev.map(g => g.id));
                        const newGames = data.results.filter(g => !existingIds.has(g.id));
                        const updated = [...prev, ...newGames];
                        const winner = computeMostPopular(updated);
                        if (winner) setMostPopularGameId(winner.id);
                        return updated;
                    });
                    setHasMore(data.next !== null);
                    setPage(nextPage);
                } else {
                    setHasMore(false);
                }
                setIsLoadingMore(false);
            })
            .catch(err => {
                console.error('Error loading more games:', err);
                setIsLoadingMore(false);
            });
    }, [page, hasMore, isLoadingMore, search]);

    useEffect(() => {
        setLoading(true);
        const API_URL = `https://api.rawg.io/api/games?key=${API_KEY}&page=1&page_size=40`;
        
        fetch(API_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch games');
                }
                return response.json();
            })
            .then(data => {
                if (data.results && data.results.length > 0) {
                    setGames(data.results);
                    setHasMore(data.next !== null);
                    const winner = computeMostPopular(data.results);
                    if (winner) setMostPopularGameId(winner.id);
                    renderGenreChart(data.results);
                    renderRatingChart(data.results);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching games:', err);
                setError('Failed to load games. Please check your API key or use the proxy server.');
                setLoading(false);
            });
    }, []);


    useEffect(() => {
        localStorage.setItem('gameFavorites', JSON.stringify(favorites));
    }, [favorites]);

    const toggleFavorite = (gameId) => {
        setFavorites(prev => {
            if (prev.includes(gameId)) {
                return prev.filter(id => id !== gameId);
            } else {
                return [...prev, gameId];
            }
        });
    };

    const filteredGames = games.filter(game => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        const nameMatch = game.name.toLowerCase().includes(searchLower);
        const genreMatch = game.genres && game.genres.some(genre => 
            genre.name.toLowerCase().includes(searchLower)
        );
        return nameMatch || genreMatch;
    });

    const groupGamesByGenre = (gamesList) => {
        const genreMap = {};
        gamesList.forEach(game => {
            if (game.genres && game.genres.length > 0) {
                game.genres.forEach(genre => {
                    if (!genreMap[genre.name]) {
                        genreMap[genre.name] = [];
                    }
                    if (!genreMap[genre.name].find(g => g.id === game.id)) {
                        genreMap[genre.name].push(game);
                    }
                });
            }
        });
        return genreMap;
    };

    const renderGameCard = (game) => {
        const genres = game.genres && game.genres.length > 0 
            ? game.genres.slice(0, 2).map(g => g.name).join(' | ')
            : 'Game';
        const isFavorited = favorites.includes(game.id);
        const isWinner = game.id === mostPopularGameId;
        const cardId = isWinner ? 'winnerCard' : null;
        
        return React.createElement('div', { 
            key: game.id,
            id: cardId,
            className: `game-card ${isFavorited ? 'favorited' : ''} ${isWinner ? 'card-winner' : ''}` 
        },
            isWinner && React.createElement('div', { className: 'winner-badge', title: 'Winner — Most Popular' },
                React.createElement('span', { className: 'winner-crown' }, '👑'),
                React.createElement('span', { className: 'winner-label' }, 'Winner')
            ),
            game.background_image && React.createElement('img', {
                src: game.background_image,
                alt: game.name,
                className: 'game-image'
            }),
            React.createElement('div', { className: 'game-card-content' },
                React.createElement('div', { className: 'game-name' }, game.name),
                React.createElement('div', { className: 'game-rating' },
                    React.createElement('span', { className: 'game-rating-star' }, '⭐'),
                    React.createElement('span', null, game.rating ? game.rating.toFixed(2) : 'N/A')
                ),
                React.createElement('div', { className: 'game-tag' }, genres),
                React.createElement('button', {
                    className: `favorite-btn ${isFavorited ? 'favorited' : ''}`,
                    onClick: () => toggleFavorite(game.id)
                }, isFavorited ? '♥ Favorited' : '♡ Add to favorites')
            )
        );
    };

    if (loading) {
        return React.createElement('div', { className: 'loading' }, 'Loading games...');
    }

    if (error) {
        return React.createElement('div', { className: 'error' }, error);
    }

    const favoriteGames = favorites.map(id => games.find(g => g.id === id)).filter(Boolean);
    const genreGroups = search ? {} : groupGamesByGenre(games);
    const topGenres = Object.keys(genreGroups)
        .sort((a, b) => genreGroups[b].length - genreGroups[a].length)
        .slice(0, 5);

    if (search) {
        return React.createElement(
            'div',
            null,
            React.createElement('div', { className: 'search-container' },
                React.createElement('input', {
                    type: 'text',
                    className: 'search-input',
                    placeholder: '🔍 Search games...',
                    value: search,
                    onChange: (e) => setSearch(e.target.value)
                })
            ),
            React.createElement('div', { className: 'game-row' },
                React.createElement('h2', { className: 'row-title' }, `Search Results (${filteredGames.length})`),
                React.createElement('div', { className: 'h-scroll' },
                    filteredGames.map(renderGameCard)
                )
            )
        );
    }

    return React.createElement(
        'div',
        null,
        React.createElement('div', { className: 'search-container' },
            React.createElement('input', {
                type: 'text',
                className: 'search-input',
                placeholder: '🔍 Type to search games...',
                value: search,
                onChange: (e) => setSearch(e.target.value)
            })
        ),
        favoriteGames.length > 0 && React.createElement('div', { id: 'favoritesRow', className: 'game-row' },
            React.createElement('h2', { className: 'row-title' }, '❤️ Your Favorites →'),
            React.createElement('div', { className: 'h-scroll' },
                favoriteGames.map(renderGameCard)
            )
        ),
        React.createElement('div', { id: 'trendingRow', className: 'game-row' },
            React.createElement('h2', { className: 'row-title' }, '🔥 Trending Games →'),
            React.createElement('div', { className: 'h-scroll' },
                games.slice(0, 40).map(renderGameCard)
            )
        ),
        topGenres.map(genreName => {
            const genreEmoji = genreName === 'Action' ? '⚔' : genreName === 'Adventure' ? '🎯' : genreName === 'RPG' ? '⚔' : genreName === 'Shooter' ? '🔫' : '🎮';
            return React.createElement('div', { key: genreName, className: 'game-row' },
                React.createElement('h2', { className: 'row-title' }, `${genreEmoji} ${genreName} →`),
                React.createElement('div', { className: 'h-scroll' },
                    genreGroups[genreName].map(renderGameCard)
                )
            );
        }),
        !search && hasMore && React.createElement('div', { className: 'load-more-container' },
            isLoadingMore ? 
                React.createElement('div', { className: 'loading-more' }, 'Loading more games...') :
                React.createElement('button', {
                    className: 'see-more-btn',
                    onClick: loadMoreGames
                }, 'See More')
        )
    );
}

// Render the React app
ReactDOM.render(React.createElement(App), document.getElementById('app'));

// Menu handlers (after React renders)
function openMenu() {
    const nav = document.getElementById('sideNav');
    const btn = document.getElementById('hamburgerBtn');
    if (nav && btn) {
        nav.classList.add('open');
        nav.setAttribute('aria-hidden', 'false');
        btn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }
}

function closeMenu() {
    const nav = document.getElementById('sideNav');
    const btn = document.getElementById('hamburgerBtn');
    if (nav && btn) {
        nav.classList.remove('open');
        nav.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }
}

function navTo(e) {
    e.preventDefault();
    const target = e.target.dataset.target || e.target.closest('a')?.dataset.target;
    if (!target) return;
    
    const element = document.getElementById(target);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    closeMenu();
}

// Wire up menu handlers after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sideClose = document.getElementById('sideClose');
    const menuLinks = document.querySelectorAll('.side-menu a');
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', openMenu);
    }
    
    if (sideClose) {
        sideClose.addEventListener('click', closeMenu);
    }
    
    menuLinks.forEach(link => {
        link.addEventListener('click', navTo);
    });
    
    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });
    
    // Close menu when clicking overlay
    const sideNav = document.getElementById('sideNav');
    if (sideNav) {
        sideNav.addEventListener('click', (e) => {
            if (e.target === sideNav) {
                closeMenu();
            }
        });
    }
});

