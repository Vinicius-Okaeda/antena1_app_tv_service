const cors = require('cors');
// Libera CORS para todas as rotas


require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();

app.use(cors({
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'devicetoken', 'appauth', 'access-control-allow-methods', 'Access-Control-Allow-Methods', 'deviceid', 'access-control-allow-origin', 'revenuecatuserid', 'access-control-allow-headers', 'a1-aegis-key', 'baseurl']
}));

app.use(express.json());

// Mensagem ao acessar a raiz
app.get('/api', (req, res) => {
	res.send('API rodando');
});

// Proxy genérico: repassa qualquer requisição para a API externa
app.use('/aegis/*', async (req, res) => {
	// Definindo headers CORS manualmente apenas para /proxy
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, devicetoken, appauth, access-control-allow-methods, Access-Control-Allow-Methods, deviceid, access-control-allow-origin, revenuecatuserid, access-control-allow-headers, a1-aegis-key, baseurl');
	// Responde a preflight OPTIONS
	if (req.method === 'OPTIONS') {
		return res.sendStatus(204);
	}
	const endpoint = req.params[0];
	const url = `https://aegis.antena1.com.br/${endpoint}`;
	const origin = req.headers.origin || 'Origem não informada';
	console.log('Headers da requisição original:', req.headers);
	console.log('[PROXY] Início da requisição');
	console.log(`[PROXY] Requisição recebida: ${req.method} ${req.originalUrl} | Origin: ${origin}`);
	try {
		console.log('[PROXY] Fazendo requisição para API externa:', url);
		const requestHeaders = { ...req.headers, host: 'aegis.antena1.com.br' };
		console.log('[PROXY] Headers enviados para API externa:', requestHeaders);
		const response = await axios({
			method: req.method,
			url,
			headers: requestHeaders,
			data: req.body,
			params: req.query,
			responseType: 'stream'
		});
		console.log('[PROXY] Resposta recebida da API externa, enviando para origem...');
		res.set(response.headers);
		// Reaplica os headers de CORS para garantir que não sejam sobrescritos
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, devicetoken, appauth, access-control-allow-methods, Access-Control-Allow-Methods, deviceid, access-control-allow-origin, revenuecatuserid, access-control-allow-headers, a1-aegis-key, baseurl');
		response.data.pipe(res);
		response.data.on('end', () => {
			console.log(`[PROXY] Sucesso: resposta enviada para origem: ${origin} | Endpoint: ${url}`);
		});
		response.data.on('error', (err) => {
			console.log('[PROXY] Erro ao enviar resposta para origem:', err);
		});
	} catch (error) {
		console.log(`[PROXY] Erro na requisição para API externa no endpoint: ${url}`);
		console.log('[PROXY] Mensagem do erro:', error.message);
		res.status(error.response?.status || 500)
		  .header('Access-Control-Allow-Origin', '*')
		  .header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
		  .header('Access-Control-Allow-Headers', 'Content-Type, Authorization, devicetoken, appauth, access-control-allow-methods, Access-Control-Allow-Methods, deviceid, access-control-allow-origin, revenuecatuserid, access-control-allow-headers, a1-aegis-key, baseurl')
		  .json({ error: error.message, endpoint: url });
	}
});

// Proxy genérico: repassa qualquer requisição para a API externa
app.use('/a1/*', async (req, res) => {
	// Definindo headers CORS manualmente apenas para /proxy
	//res.header('Access-Control-Allow-Origin', '*');
	//res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
	//res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, devicetoken, appauth, access-control-allow-methods, Access-Control-Allow-Methods, deviceid, access-control-allow-origin, revenuecatuserid, access-control-allow-headers, a1-aegis-key, baseurl');
	// Responde a preflight OPTIONS
	if (req.method === 'OPTIONS') {
		return res.sendStatus(204);
	}
	const endpoint = req.params[0];
	const url = `https://antena1.com.br/${endpoint}`;
	const origin = req.headers.origin || 'Origem não informada';
	console.log('Headers da requisição original:', req.headers);
	console.log('[PROXY] Início da requisição');
	console.log(`[PROXY] Requisição recebida: ${req.method} ${req.originalUrl} | Origin: ${origin}`);
	try {
		console.log('[PROXY] Fazendo requisição para API externa:', url);
		const requestHeaders = { ...req.headers, host: 'antena1.com.br' };
		console.log('[PROXY] Headers enviados para API externa:', requestHeaders);
		const response = await axios({
			method: req.method,
			url,
			headers: requestHeaders,
			data: req.body,
			params: req.query,
			responseType: 'stream'
		});
		console.log('[PROXY] Resposta recebida da API externa, enviando para origem...');
		res.set(response.headers);
		// Reaplica os headers de CORS para garantir que não sejam sobrescritos
	//res.header('Access-Control-Allow-Origin', '*');
	//res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
		//res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, devicetoken, appauth, access-control-allow-methods, Access-Control-Allow-Methods, deviceid, access-control-allow-origin, revenuecatuserid, access-control-allow-headers, a1-aegis-key, baseurl');
		response.data.pipe(res);
		response.data.on('end', () => {
			console.log(`[PROXY] Sucesso: resposta enviada para origem: ${origin} | Endpoint: ${url}`);
		});
		response.data.on('error', (err) => {
			console.log('[PROXY] Erro ao enviar resposta para origem:', err);
		});
	} catch (error) {
		console.log(`[PROXY] Erro na requisição para API externa no endpoint: ${url}`);
		console.log('[PROXY] Mensagem do erro:', error.message);
		res.status(error.response?.status || 500)
		  .header('Access-Control-Allow-Origin', '*')
		  .header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
		  .header('Access-Control-Allow-Headers', 'Content-Type, Authorization, devicetoken, appauth, access-control-allow-methods, Access-Control-Allow-Methods, deviceid, access-control-allow-origin, revenuecatuserid, access-control-allow-headers, a1-aegis-key, baseurl')
		  .json({ error: error.message, endpoint: url });
	}
});

app.use('/api/testeCors', async (req, res) => {
	try {
		const response = await axios.get('https://antena1.com.br/api/v1/getTop10/1');
		console.log('Resposta da API externa:', response.data);
		res.json(response.data);

	} catch (error) {
		console.log(error);
	}
})

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
	console.log(`Proxy rodando na porta ${PORT}`);
});
