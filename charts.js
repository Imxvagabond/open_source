// Chart.js functions to render genre and rating charts

let genreChartInstance = null;
let ratingChartInstance = null;

function renderGenreChart(games) {
    // Count games by genre
    const genreCount = {};
    
    games.forEach(game => {
        if (game.genres && game.genres.length > 0) {
            game.genres.forEach(genre => {
                genreCount[genre.name] = (genreCount[genre.name] || 0) + 1;
            });
        }
    });

    // Sort genres by count and get top 10
    const sortedGenres = Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const genreLabels = sortedGenres.map(item => item[0]);
    const genreCounts = sortedGenres.map(item => item[1]);

    // Destroy existing chart if it exists
    if (genreChartInstance) {
        genreChartInstance.destroy();
    }

    const ctx = document.getElementById('genreChart');
    if (!ctx) return;

    genreChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: genreLabels,
            datasets: [{
                label: 'Number of Games',
                data: genreCounts,
                backgroundColor: 'rgba(231, 29, 43, 0.8)',
                borderColor: 'rgba(231, 29, 43, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Top 10 Genres by Game Count',
                    color: '#ffffff',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

function renderRatingChart(games) {
    // Get top 15 games by rating
    const sortedGames = [...games]
        .filter(game => game.rating)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 15);

    const gameNames = sortedGames.map(game => game.name.length > 20 ? game.name.substring(0, 20) + '...' : game.name);
    const ratings = sortedGames.map(game => game.rating);

    // Destroy existing chart if it exists
    if (ratingChartInstance) {
        ratingChartInstance.destroy();
    }

    const ctx = document.getElementById('ratingChart');
    if (!ctx) return;

    ratingChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: gameNames,
            datasets: [{
                label: 'Rating',
                data: ratings,
                borderColor: 'rgba(231, 29, 43, 1)',
                backgroundColor: 'rgba(231, 29, 43, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(231, 29, 43, 1)',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Top 15 Games by Rating',
                    color: '#ffffff',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    beginAtZero: false,
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 0.5,
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

