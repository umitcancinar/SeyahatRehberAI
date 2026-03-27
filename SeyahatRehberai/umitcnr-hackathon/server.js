const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { search } = require('duck-duck-scrape');

const app = express();
const PORT = 3000;

// Senin API Anahtarın ve Gemini 3 Flash model ismini kalbe gömdük
const API_KEY = "AIzaSyBltY7PeZ2f5ZZbfhtPoWcZstv4jNiUwbU";
const MODEL_NAME = "gemini-3-flash-preview"; 

const genAI = new GoogleGenerativeAI(API_KEY);

app.use(cors());
app.use(express.json());

app.post('/api/generate-guide', async (req, res) => {
    try {
        const { city } = req.body;

        if (!city) {
            return res.status(400).json({ error: "Şehir adı zorunludur." });
        }

        console.log(`[RehberAI] ${city} için sistem başlatıldı...`);

        // Tek ve temiz bir sorgu ile DuckDuckGo'yu yormadan deniyoruz
        const query = `"${city}" seyahat uyarıları güncel haberler etkinlikler`;
        let combinedSearchResultsText = "";
        
        try {
            console.log(`[RehberAI] Web taranıyor...`);
            const results = await search(query); 
            const snippet = results.results.slice(0, 5).map(r => `${r.title}\n${r.description}`).join('\n\n'); 
            combinedSearchResultsText += snippet;
        } catch (searchError) {
            console.warn(`[Uyarı] Web taraması atlandı (Engellendi): ${searchError.message}`);
        }

        // --- B PLANI (FALLBACK) ---
        let finalPromptContent = "";
        if (!combinedSearchResultsText.trim()) {
            console.log(`[RehberAI] B Planı: Gemini 3 Flash kendi zekasını kullanıyor.`);
            finalPromptContent = `Şu an web araması yapılamıyor. Lütfen kendi güncel veritabanını kullanarak ${city} için detaylı bir rehber hazırla.`;
        } else {
            console.log(`[RehberAI] Web verileri toplandı, analiz ediliyor...`);
            finalPromptContent = `Aşağıdaki web verilerini analiz ederek ${city} için bir rehber oluştur:\n\n${combinedSearchResultsText}`;
        }

        // --- Gemini 3 Flash Analizi ---
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const systemInstructions = `Sen profesyonel bir seyahat danışmanısın. ${city} şehri için aşağıdaki formatta temiz bir Markdown raporu oluştur.

        ### **${city} Seyahat Rehberi**

        ✅ **Avantajlar & Fırsatlar:**
        (Şehrin şu anki güzellikleri ve fırsatları)

        ⚠️ **Dezavantajlar & Riskler:**
        (Dikkat edilmesi gereken olumsuz durumlar)

        🚧 **Yerel Uyarılar:**
        (Turist tuzakları ve güvenlik önerileri)
        `;

        const result = await model.generateContent(`${systemInstructions}\n\n${finalPromptContent}`);
        const response = await result.response;
        const finalGuide = response.text();

        console.log(`[RehberAI] ${city} rehberi hazır!`);
        res.json({ guide: finalGuide });

    } catch (error) {
        console.error("Backend Hatası:", error.message);
        res.status(500).json({ error: "Sistem şu an meşgul, lütfen az sonra tekrar dene." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SeyahatRehberAI Backend çalışıyor: http://localhost:${PORT}`);
    console.log(`🤖 Kullanılan Model: ${MODEL_NAME}`);
});