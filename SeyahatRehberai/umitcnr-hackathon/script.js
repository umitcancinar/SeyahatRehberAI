document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const htmlEl = document.documentElement;
    const sendBtn = document.getElementById('send-btn');
    const cityInput = document.getElementById('city-input');
    const welcomeScreen = document.getElementById('welcome-screen');
    const resultContent = document.getElementById('result-content');
    const historyList = document.getElementById('history-list');

    // Theme Toggle Logic
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlEl.setAttribute('data-theme', newTheme);
        themeToggle.textContent = newTheme === 'light' ? '🌙' : '☀️';
    });

    // Sidebar Toggle Logic
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // History Logic
    const loadHistory = () => {
        const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        historyList.innerHTML = '';
        history.forEach(city => {
            const li = document.createElement('li');
            li.textContent = city;
            li.className = 'history-item';
            li.addEventListener('click', () => {
                cityInput.value = city;
                fetchGuide();
                if (window.innerWidth <= 768) {
                    sidebar.classList.add('collapsed');
                }
            });
            historyList.appendChild(li);
        });
    };

    const saveHistory = (city) => {
        let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        if (!history.includes(city)) {
            history.unshift(city);
            if (history.length > 10) history.pop();
            localStorage.setItem('searchHistory', JSON.stringify(history));
            loadHistory();
        }
    };

    loadHistory();

    // Loading Messages Logic
    const loadingMessages = [
        "Sokakları geziliyor...",
        "Gizli kalmış yerler aranıyor...",
        "Yerel esnaf tavsiyeleri toplanıyor...",
        "En iyi lezzet durakları analiz ediliyor...",
        "Yapay zeka notlarını toparlıyor..."
    ];
    let loadingInterval;
    let messageIndex = 0;

    const startLoadingAnimation = (city) => {
        resultContent.innerHTML = `<div class="loading-container"><div class="spinner"></div><p id="loading-text">🚀 ${city} için web taranıyor...</p></div>`;
        const loadingText = document.getElementById('loading-text');
        
        loadingInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            loadingText.style.opacity = 0;
            setTimeout(() => {
                loadingText.textContent = loadingMessages[messageIndex];
                loadingText.style.opacity = 1;
            }, 300); // fade out duration
        }, 2000);
    };

    const stopLoadingAnimation = () => {
        clearInterval(loadingInterval);
        messageIndex = 0;
    };

    // Send Request Logic
    const fetchGuide = async () => {
        const city = cityInput.value.trim();
        if (!city) return;

        // UI Updates for Loading
        welcomeScreen.classList.add('hidden');
        resultContent.classList.remove('hidden');
        document.body.style.backgroundImage = 'none'; // Reset before loading new
        document.body.classList.remove('bg-active');
        htmlEl.classList.add('has-results'); // Allows input to fall to bottom

        startLoadingAnimation(city);
        
        // Save to placeholder
        const currentCity = city;
        cityInput.value = '';

        try {
            const response = await fetch('http://localhost:3000/api/generate-guide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city: currentCity })
            });

            if (!response.ok) throw new Error('Sunucu hatası oluştu.');

            const data = await response.json();
            stopLoadingAnimation();
            
            // Set dynamic background image
            if (data.bgImage) {
                document.body.style.backgroundImage = `url('${data.bgImage}')`;
                document.body.classList.add('bg-active');
            }
            
            // Format markdown text with marked.js or basic replacement
            let formattedGuide = data.guide
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');

            resultContent.innerHTML = `<div class="ai-response glass-panel">
                <h2>${currentCity}</h2>
                <div style="margin-top: 15px;">${formattedGuide}</div>
            </div>`;
            
            saveHistory(currentCity);
            
        } catch (error) {
            console.error("Hata:", error);
            stopLoadingAnimation();
            resultContent.innerHTML = `<p style="color: red;" class="glass-panel">❌ Üzgünüm, verileri çekerken bir hata oluştu. Lütfen tekrar deneyin.</p>`;
        }
    };

    sendBtn.addEventListener('click', fetchGuide);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') fetchGuide();
    });
});
