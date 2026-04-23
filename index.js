require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const https = require('https');

// Força IPv4 para evitar bloqueio do Sucuri via IPv6
const httpsAgentIPv4 = new https.Agent({ family: 4 });

const app = express();

// ─── Variáveis de ambiente ────────────────────────────────────────────────────
const PORT = process.env.PORT || 4001;
const SERVICE_TOKEN = process.env.SERVICE_TOKEN;
const A1_AEGIS_KEY = process.env.A1_AEGIS_KEY;

if (!SERVICE_TOKEN || !A1_AEGIS_KEY) {
	console.error('[FATAL] Variáveis de ambiente obrigatórias não definidas.');
	process.exit(1);
}

// ─── Middlewares globais ──────────────────────────────────────────────────────
app.use(cors({
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: [
		'Content-Type', 'Authorization', 'devicetoken', 'appauth',
		'deviceid', 'revenuecatuserid', 'a1-aegis-key', 'baseurl'
	]
}));

app.use(express.json());

// ─── Middleware de autenticação por token estático ────────────────────────────
function requireAuth(req, res, next) {
	const authHeader = req.headers['authorization'];
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'Token não informado.' });
	}
	const token = authHeader.split(' ')[1];
	if (token !== SERVICE_TOKEN) {
		return res.status(403).json({ error: 'Token inválido.' });
	}
	next();
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
	res.json({ status: 'ok' });
});

// ─── Proxy /a1/* → antena1.com.br (sem autenticação) ─────────────────────────
app.use('/a1/*', async (req, res) => {
	if (req.method === 'OPTIONS') return res.sendStatus(204);

	const endpoint = req.params[0];
	const url = `https://antena1.com.br/api/v1/${endpoint}`;

	try {
		const response = await axios({
			method: req.method,
			url,
			headers: { ...req.headers, host: 'antena1.com.br' },
			data: req.body,
			params: req.query,
			responseType: 'stream'
		});
		res.set(response.headers);
		response.data.pipe(res);
	} catch (error) {
		console.error(`[/a1] Erro: ${url} | ${error.message}`);
		res.status(error.response?.status || 500).json({ error: error.message });
	}
});

// ─── Proxy /api/web/* → www.antena1.com.br (requer JWT) ─────────────────────
app.use('/api/web/*', requireAuth, async (req, res) => {
	const endpoint = req.params[0];
	const url = `https://www.antena1.com.br/api/v1/${endpoint}`;

	const forwardHeaders = {
		'host': 'www.antena1.com.br',
		'user-agent': req.headers['user-agent'] || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
		'origin': 'https://www.antena1.com.br',
		'accept': req.headers['accept'] || 'application/json',
		'accept-language': req.headers['accept-language'] || 'pt-BR,pt;q=0.9',
	};
	if (req.headers['cookie']) {
		forwardHeaders['cookie'] = req.headers['cookie'];
	}

	try {
		const response = await axios({
			method: req.method,
			url,
			headers: forwardHeaders,
			httpsAgent: httpsAgentIPv4,
			data: req.body,
			params: req.query,
		});
		res.json(response.data);
	} catch (error) {
		console.error(`[/api/web] Erro: ${url} | ${error.message}`);
		res.status(error.response?.status || 500).json({ error: error.message });
	}
});

// ─── Proxy /api/fm/* → antenna1.fm (requer JWT) ──────────────────────────────
app.use('/api/fm/*', requireAuth, async (req, res) => {
	const endpoint = req.params[0];
	const url = `https://antenna1.fm/api/v1/${endpoint}`;

	try {
		const response = await axios({
			method: req.method,
			url,
			data: req.body,
			params: req.query,
		});
		res.json(response.data);
	} catch (error) {
		console.error(`[/api/fm] Erro: ${url} | ${error.message}`);
		res.status(error.response?.status || 500).json({ error: error.message });
	}
});

// ─── Proxy /api/tv/* → aegis.antena1.com.br (requer JWT) ─────────────────────
app.use('/api/tv/*', requireAuth, async (req, res) => {
	const endpoint = req.params[0];
	const url = `http://aegis.antena1.com.br/api/v1/${endpoint}`;

	try {
		const response = await axios({
			method: req.method,
			url,
			headers: {
				'baseUrl': 'http://aegis.antena1.com.br/api/v1/',
				'A1-Aegis-Key': A1_AEGIS_KEY,
			},
			data: req.body,
		});

		let responseData = response.data;

		if (endpoint.startsWith('app/streams/') && Array.isArray(responseData)) {
			const PROXY_BASE = process.env.PROXY_BASE_URL || `http://localhost:${PORT}`;
			const urlMappings = [
				{ upstream: 'https://www.antena1.com.br/api/v1/', proxyPath: `${PROXY_BASE}/api/web/` },
				{ upstream: 'https://antenna1.fm/api/v1/', proxyPath: `${PROXY_BASE}/api/fm/` },
			];
			responseData = responseData.map(stream => {
				let meta = stream.meta;
				let history = stream.history;
				for (const { upstream, proxyPath } of urlMappings) {
					if (meta) meta = meta.replace(upstream, proxyPath);
					if (history) history = history.replace(upstream, proxyPath);
				}
				return { ...stream, meta, history };
			});
		}

		res.json(responseData);
	} catch (error) {
		console.error(`[/api/tv] Erro: ${url} | ${error.message}`);
		res.status(error.response?.status || 500).json({ error: error.message });
	}
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
	const now = new Date().toLocaleString('pt-BR', { hour12: false });
	console.log(`Proxy rodando na porta ${PORT} | ${now}`);
});
