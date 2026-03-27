require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const google = require('googlethis');

const app = express();
const PORT = 3000;

const API_KEY = process.env.GEMINI_API_KEY;
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
        const query = `"${city}" gezi rehberi sırları bilinmeyen yerleri güncel restoranlar`;
        let combinedSearchResultsText = "";
        let bgImage = "";
        
        try {
            console.log(`[RehberAI] Google'da Web taranıyor...`);
            const searchOptions = {
                page: 0, 
                safe: false, 
                additional_params: { hl: 'tr' }
            };
            const results = await google.search(query, searchOptions); 
            const snippet = results.results.slice(0, 5).map(r => `${r.title}\n${r.description}`).join('\n\n'); 
            combinedSearchResultsText += snippet;

            console.log(`[RehberAI] Şehir görseli aranıyor...`);
            const imageResponse = await google.image(`${city} city landscape ultra hd`, { safe: false });
            if (imageResponse.length > 0) {
                bgImage = imageResponse[0].url;
            }
        } catch (searchError) {
            console.warn(`[Uyarı] Web taraması atlandı (Engellendi): ${searchError.message}`);
        }

        // --- B PLANI (FALLBACK) ---
        let finalPromptContent = "";
        if (!combinedSearchResultsText.trim()) {
            console.log(`[RehberAI] B Planı: Gemini 3 Flash kendi zekasını kullanıyor.`);
            finalPromptContent = `Şu an web araması yapılamıyor. Lütfen kendi güncel veritabanını kullanarak ${city} için çok samimi, gizli kalmış detayları içeren detaylı bir rehber hazırla.`;
        } else {
            console.log(`[RehberAI] Web verileri toplandı, analiz ediliyor...`);
            finalPromptContent = `Aşağıdaki güncel Google web verilerini analiz ederek ${city} için en samimi, sıra dışı, bilinmeyen detayları içeren bir rehber oluştur:\n\n${combinedSearchResultsText}`;
        }

        // --- Gemini 3 Flash Analizi ---
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const systemInstructions = `Sen dünyanın en cana yakın, en donanımlı ve sırları bilen profesyonel bir seyahat danışmanısın. Cevapların çok samimi, içten ve turist klişelerinden uzak olmalı.
        ${city} şehri için aşağıdaki formatta temiz bir Markdown raporu oluştur. Herkese açık bilinen şeylerin yanına, sadece yerellerin bildiği inanılmaz detaylar (gizli kafeler, izbe ama efsanevi restoranlar, esnaf sırları) ekle. İşimiz bu!

        ### **✨ ${city} Seyahat Rehberi**

        ✅ **Görülmeye Değer Güzellikler & Gizli Sırlar:**
        (Şehrin en güzel yanları ve kimsenin bilmediği, turist tuzaklarından uzak gizli köşeler, özel lezzet durakları)

        ⚠️ **Dezavantajlar & Dikkat Edilmesi Gerekenler:**
        (Bu şehrin zorlukları, abartılmış yerler veya vakit kaybı olabilecek mekanlar)

        🚧 **Gerçekçi Yerel Uyarılar:**
        (Esnaf kurnazlıkları, turist tuzakları, güvenlik, ulaşım gibi konularda hayati uyarılar)
        
        💡 **İçeriden Bilgi (Bonus):**
        (Sadece orada yaşayanların bildiği ufak ama hayat kurtaran veya çok keyif verecek nadide bir detay ver. Örn: "Salı günleri şu pazara giderseniz..." vb.)
        `;

        const result = await model.generateContent(`${systemInstructions}\n\n${finalPromptContent}`);
        const response = await result.response;
        const finalGuide = response.text();

        console.log(`[RehberAI] ${city} rehberi hazır!`);
        res.json({ guide: finalGuide, bgImage });

    } catch (error) {
        console.error("Backend Hatası:", error.message);
        res.status(500).json({ error: "Sistem şu an meşgul, lütfen az sonra tekrar dene." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SeyahatRehberAI Backend çalışıyor: http://localhost:${PORT}`);
    console.log(`🤖 Kullanılan Model: ${MODEL_NAME}`);
});
