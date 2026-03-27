document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const htmlEl = document.documentElement;
    const sendBtn = document.getElementById('send-btn');
    const cityInput = document.getElementById('city-input');
    const welcomeScreen = document.getElementById('welcome-screen');
    const resultContent = document.getElementById('result-content');

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

    // Send Request Logic
    const fetchGuide = async () => {
        const city = cityInput.value.trim();
        if (!city) return;

        // UI Updates for Loading
        welcomeScreen.classList.add('hidden');
        resultContent.classList.remove('hidden');
        resultContent.innerHTML = `<p>🚀 ${city} için web taranıyor ve güncel veriler analiz ediliyor. Lütfen bekleyin...</p>`;
        cityInput.value = '';

        try {
            // Backend'e istek atıyoruz (Port 3000 üzerinden çalışacağını varsayıyoruz)
            const response = await fetch('http://localhost:3000/api/generate-guide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city })
            });

            if (!response.ok) throw new Error('Sunucu hatası oluştu.');

            const data = await response.json();
            
            // Başarılı sonucu ekrana bas (Markdown render işlemi eklenebilir)
            resultContent.innerHTML = `<div class="ai-response">${data.guide.replace(/\n/g, '<br>')}</div>`;
            
        } catch (error) {
            console.error("Hata:", error);
            resultContent.innerHTML = `<p style="color: red;">❌ Üzgünüm, verileri çekerken bir hata oluştu. Lütfen tekrar deneyin.</p>`;
        }
    };

    sendBtn.addEventListener('click', fetchGuide);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') fetchGuide();
    });
});