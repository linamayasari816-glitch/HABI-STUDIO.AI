const axios = require('axios');

// Database penyimpanan token sementara di memori serverless Vercel
let tokenStorage = {
    omniapi: { token: null, email: "Belum terdaftar", status: "OFFLINE" },
    leonardo: { token: null, email: "Belum terdaftar", status: "OFFLINE" },
    magnific: { token: null, email: "Belum terdaftar", status: "OFFLINE" }
};

const STABLE_API_POOL = [
    { name: "MailTM", url: "https://api.mail.tm" },
    { name: "MailGW", url: "https://api.mail.gw" },
    { name: "InboxesApp", url: "https://api.inboxes.app/v1" },
    { name: "TempMailLol", url: "https://api.tempmail.lol" }
];

// Generator Header Browser Palsu untuk mengelabui Cloudflare
const getCleanHeaders = (targetHost) => ({
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Origin': `https://${targetHost}`,
    'Referer': `https://${targetHost}/`,
    'Content-Type': 'application/json'
});

async function ambilEmailMultiRaksasa() {
    const target = STABLE_API_POOL[Math.floor(Math.random() * STABLE_API_POOL.length)];
    try {
        const res = await axios.get(`${target.url}/domains`);
        let daftarDomain = [];
        
        if (res.data && res.data['hydra:member']) {
            daftarDomain = res.data['hydra:member'].map(d => d.domain);
        } else if (Array.isArray(res.data)) {
            daftarDomain = res.data;
        } else if (res.data.domains) {
            daftarDomain = res.data.domains;
        }

        if (daftarDomain.length === 0) throw new Error("Domain kosong");

        const domainTerpilih = daftarDomain[Math.floor(Math.random() * daftarDomain.length)];
        const namaAcak = ["ari", "budi", "dian", "rudi", "siti", "mega", "hadi", "habisongs"];
        const belakangAcak = ["wijaya", "saputra", "lestari", "kurniawan", "horeg", "remix"];
        const randomStr = Math.floor(100 + Math.random() * 900);
        
        const username = `${namaAcak[Math.floor(Math.random() * namaAcak.length)]}${belakangAcak[Math.floor(Math.random() * belakangAcak.length)]}${randomStr}`;
        const email = `${username}@${domainTerpilih}`;
        const password = `HabiStudioSecure2026!`;

        if (target.name === "MailTM" || target.name === "MailGW") {
            await axios.post(`${target.url}/accounts`, { address: email, password: password });
            const loginRes = await axios.post(`${target.url}/token`, { address: email, password: password });
            return { email, password, name: target.name, baseUrl: target.url, tokenMail: loginRes.data.token };
        }
        
        return { email, password, name: target.name, baseUrl: target.url, tokenMail: null };
    } catch (e) {
        return await ambilEmailMultiRaksasa(); // Rekursif jika satu provider gagal
    }
}

async function registerAiAccount(targetAi) {
    try {
        const akunEmail = await ambilEmailMultiRaksasa();
        let registerEndpoint = "";
        let host = "";

        if (targetAi === "leonardo") { registerEndpoint = "https://cloud.leonardo.ai/api/v1/auth/register-dev"; host = "cloud.leonardo.ai"; }
        if (targetAi === "magnific") { registerEndpoint = "https://api.magnific.com/v1/auth/developer/signup"; host = "api.magnific.com"; }
        if (targetAi === "omniapi") { registerEndpoint = "https://api.omniapi.co/v1/auth/register"; host = "api.omniapi.co"; }

        const regRes = await axios.post(registerEndpoint, {
            email: akunEmail.email,
            password: akunEmail.password
        }, { headers: getCleanHeaders(host) });

        // Jeda Pemanasan Akun (Token Warm-Up)
        await new Promise(resolve => setTimeout(resolve, 3000));

        let tokenPecah = regRes.data.api_key || regRes.data.token || "MOCK_API_KEY_HABI_PRO_2026";
        
        tokenStorage[targetAi] = {
            token: tokenPecah,
            email: akunEmail.email,
            status: "ACTIVE"
        };
        return tokenPecah;
    } catch (err) {
        return await registerAiAccount(targetAi); // Otomatis rotasi jika email diblokir AI
    }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Jalur GET untuk memantau status API Key di Frontend mewah
    if (req.method === 'GET') {
        return res.status(200).json({ success: true, monitor: tokenStorage });
    }

    const { mode, prompt, audio_url, ai_type } = req.body;

    if (!prompt || !ai_type) {
        return res.status(400).json({ success: false, message: "Parameter 'prompt' dan 'ai_type' wajib diisi!" });
    }

    try {
        if (!tokenStorage[ai_type].token) {
            await registerAiAccount(ai_type);
        }

        let hasilAi = null;
        const currentToken = tokenStorage[ai_type].token;

        if (ai_type === "leonardo") {
            const resLeo = await axios.post('https://cloud.leonardo.ai/api/v1/generations', { prompt: prompt }, {
                headers: { 'Authorization': `Bearer ${currentToken}`, ...getCleanHeaders('cloud.leonardo.ai') }
            });
            hasilAi = resLeo.data;
        } else if (ai_type === "magnific") {
            const resMag = await axios.post('https://api.magnific.com/v1/upscale', { image_url: audio_url, prompt: prompt }, {
                headers: { 'Authorization': `Bearer ${currentToken}`, ...getCleanHeaders('api.magnific.com') }
            });
            hasilAi = resMag.data;
        } else {
            const urlSuno = mode === "cover" ? "https://api.omniapi.co/v1/suno/cover" : "https://api.omniapi.co/v1/suno/generate";
            const resSuno = await axios.post(urlSuno, { prompt: prompt, audio_url: audio_url, model: "v5.5" }, {
                headers: { 'Authorization': `Bearer ${currentToken}`, ...getCleanHeaders('api.omniapi.co') }
            });
            hasilAi = resSuno.data;
        }

        res.status(200).json({ success: true, data: hasilAi });

    } catch (error) {
        // AUTO ROTATE UTAMA: Bersihkan token mati jika terdeteksi limit habis (401/429)
        if (error.response && (error.response.status === 401 || error.response.status === 429)) {
            tokenStorage[ai_type] = { token: null, email: "Sedang merotasi...", status: "OFFLINE" };
            return module.exports(req, res); // Ulangi request otomatis dengan akun baru
        }
        res.status(500).json({ success: false, error: error.message });
    }
};