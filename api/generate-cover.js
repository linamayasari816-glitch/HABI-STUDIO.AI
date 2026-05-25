const axios = require('axios');

// Menyimpan API Key aktif sementara di memori serverless runtime
let currentOmniApiKey = null;

// Fungsi otomatisasi mendaftar email sementara & klaim token premium OmniAPI
async function generateNewOmniApiKey() {
    try {
        console.log("=== Memulai Registrasi Otomatis Akun OmniAPI ===");
        
        // 1. Ambil domain email acak dari Mail.tm
        const domainRes = await axios.get('https://api.mail.tm/domains');
        const domain = domainRes.data['hydra:member'][0].domain;
        
        // 2. Buat string, email, dan password acak
        const randomStr = Math.random().toString(36).substring(2, 10);
        const email = `habisuno.pro.${randomStr}@${domain}`;
        const password = `HabiSecurePass123!`;

        // 3. Daftarkan akun di Mail.tm
        await axios.post('https://api.mail.tm/accounts', { address: email, password: password });
        console.log(`Email Sementara Aktif: ${email}`);

        // 4. Daftarkan email tersebut ke OmniAPI
        const omniRegUrl = 'https://api.omniapi.co/v1/auth/register'; 
        await axios.post(omniRegUrl, { email: email, password: password });
        console.log("Pendaftaran terkirim ke OmniAPI. Menunggu verifikasi...");

        // 5. Dapatkan token akses Mail.tm untuk membaca kotak masuk
        const loginRes = await axios.post('https://api.mail.tm/token', { address: email, password: password });
        const tokenMail = loginRes.data.token;

        // 6. Polling kotak masuk sampai email berisi API Key tiba
        let omniToken = null;
        for (let i = 0; i < 8; i++) {
            await new Promise(resolve => setTimeout(resolve, 4000)); // Tunggu 4 detik tiap percobaan
            
            const messagesRes = await axios.get('https://api.mail.tm/messages', {
                headers: { 'Authorization': `Bearer ${tokenMail}` }
            });
            
            const messages = messagesRes.data['hydra:member'];
            if (messages.length > 0) {
                const msgId = messages[0].id;
                const detailRes = await axios.get(`https://api.mail.tm/messages/${msgId}`, {
                    headers: { 'Authorization': `Bearer ${tokenMail}` }
                });
                
                const emailBody = detailRes.data.text;
                // Ekstrak string API Key menggunakan pola Regex
                const match = emailBody.match(/your[-_]api[-_]key:\s*([^\s\n]+)/i) || emailBody.match(/[a-zA-Z0-9]{32,}/);
                if (match) {
                    omniToken = match[1] || match[0];
                    break;
                }
            }
        }

        if (!omniToken) throw new Error("Gagal membaca API Key dari email masuk.");

        console.log(`Sukses Memperoleh API Key Omni Baru: ${omniToken}`);
        currentOmniApiKey = omniToken;
        return omniToken;

    } catch (error) {
        console.error("Error pada langkah Auto-Register:", error.message);
        return null;
    }
}

// Fungsi eksekusi Suno Cover ke OmniAPI
async function requestSunoCover(prompt, audioUrl) {
    if (!currentOmniApiKey) {
        await generateNewOmniApiKey();
    }

    try {
        const response = await axios.post('https://api.omniapi.co/v1/suno/cover', {
            prompt: prompt,
            audio_url: audioUrl,
            model: "v5.5"
        }, {
            headers: {
                'Authorization': `Bearer ${currentOmniApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;

    } catch (error) {
        // Jika token expired atau kredit habis (401 / 429), regenerasi instan akun baru
        if (error.response && (error.response.status === 401 || error.response.status === 429)) {
            console.log("Kredit Omni habis! Mengganti akun otomatis...");
            const newKey = await generateNewOmniApiKey();
            if (newKey) {
                return await requestSunoCover(prompt, audioUrl);
            }
        }
        throw error;
    }
}

// Handler utama Serverless Function Vercel
module.exports = async (req, res) => {
    // Mengizinkan CORS agar bisa ditembak dari website frontend utama Anda
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: "Metode HTTP harus POST!" });
    }

    const { prompt, audio_url } = req.body;

    if (!prompt || !audio_url) {
        return res.status(400).json({ success: false, message: "Parameter 'prompt' dan 'audio_url' wajib dikirim!" });
    }

    try {
        const result = await requestSunoCover(prompt, audio_url);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memproses musik", error: error.message });
    }
};