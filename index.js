const cors = require('cors');
// Libera CORS para todas as rotas


//require('dotenv').config();

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
	console.log('Requisição recebida na raiz /api');
	res.send('API rodando');
});

// Proxy genérico: repassa qualquer requisição para a API externa

// Proxy genérico: repassa qualquer requisição para a API externa
app.use('/a1/*', async (req, res) => {
	console.log('Entrou no proxy /a1');
	// Definindo headers CORS manualmente apenas para /proxy
	//res.header('Access-Control-Allow-Origin', '*');
	//res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
	//res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, devicetoken, appauth, access-control-allow-methods, Access-Control-Allow-Methods, deviceid, access-control-allow-origin, revenuecatuserid, access-control-allow-headers, a1-aegis-key, baseurl');
	// Responde a preflight OPTIONS
	if (req.method === 'OPTIONS') {
		return res.sendStatus(204);
	}
	const endpoint = req.params[0];
	const url = `https://antena1.com.br/api/v1/${endpoint}`;
	const origin = req.headers.origin || 'Origem não informada';
	console.log('Headers da requisição original:', req.headers);
	console.log('[PROXY] Início da requisição');
	console.log(`[PROXY] Requisição recebida: ${req.method} ${req.originalUrl} | Origin: ${origin}`);
	try {
		console.log('[PROXY] Fazendo requisição para API externa:', url);
		const requestHeaders = { ...req.headers, host: 'antena1.com.br/api/v1' };
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
	console.log('Entrou na rota /api/testeCors');
	try {
		const response = await axios.get('https://antena1.com.br/api/v1/getTop10/1');
		console.log('Resposta da API externa:', response.data);
		res.json(response.data);

	} catch (error) {
		console.log(error);
	}
})

app.use('/api/web/*', async (req, res) => {
	//console.log('Entrou na rota /api/testeCors');
	const endpoint = req.params[0];
	//console.log('Endpoint solicitado:', endpoint);
	const url = `https://www.antena1.com.br/api/v1/${endpoint}`;
	try {
		//console.log('[PROXY] Fazendo requisição para API externa:', url);
		const requestHeaders = { ...req.headers, host: 'https://www.antena1.com.br/api/v1/' };
		//console.log('[PROXY] Headers enviados para API externa:', requestHeaders);
		const response = await axios({
			method: req.method,
			url,
			//headers: requestHeaders,
			data: req.body,
			//params: req.query,
			//responseType: 'stream'
		});
		//console.log('Resposta da API externa:', response.data);
		res.json(response.data);

		//console.log('[PROXY] Resposta recebida da API externa, enviando para origem...');
		//res.set(response.headers);
		// Reaplica os headers de CORS para garantir que não sejam sobrescritos
	//res.header('Access-Control-Allow-Origin', '*');
	//res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
		//res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, devicetoken, appauth, access-control-allow-methods, Access-Control-Allow-Methods, deviceid, access-control-allow-origin, revenuecatuserid, access-control-allow-headers, a1-aegis-key, baseurl');
		/*
		response.data.pipe(res);
		response.data.on('end', () => {
			console.log(`[PROXY] Sucesso: resposta enviada para origem: ${origin} | Endpoint: ${url}`);
		});
		response.data.on('error', (err) => {
			console.log('[PROXY] Erro ao enviar resposta para origem:', err);
		});
		
		*/
	} catch (error) {
		console.log(`[PROXY] Erro na requisição para API externa no endpoint: ${url}`);
		console.log('[PROXY] Mensagem do erro:', error.message);
		res.status(error.response?.status || 500)
	}
})

app.use('/api/tv/*', async (req, res) => {
	console.log('Entrou na rota /api/testeCors');
	console.log("o method é", req.method);
	const endpoint = req.params[0];
	console.log('Endpoint solicitado:', endpoint);
	const url = `http://aegis.antena1.com.br/api/v1/${endpoint}`;
	try {
		console.log('[PROXY] Fazendo requisição para API externa:', url);
		console.log("No meu body tem", req.body);
		console.log('Headers da requisição original:', req.headers);
		const requestHeaders = { ...req.headers, host: 'http://aegis.antena1.com.br/api/v1/' };
		console.log('[PROXY] Headers enviados para API externa:', requestHeaders);
		
		const response = await axios(url, {
			method: req.method,
			headers: {
				baseUrl: 'http://aegis.antena1.com.br/api/v1/',
				'A1-Aegis-Key': 'Y2uJz9Vp7WsR5MxGyHtK4NqXeF6cA1LbD3sP8rUvOwZaE0TfBhQlIjCnVmOkRd',
			},
			data: req.body,
		});
		/*
		const response = await axios({
			method: req.method,
			url,
			headers: requestHeaders,
			data: req.body,
			params: req.query,
			responseType: 'stream'
		});
		*/
		console.log('Resposta da API externa:', response.data);
		res.json(response.data);

		console.log('[PROXY] Resposta recebida da API externa, enviando para origem...');
		//res.set(response.headers);
		// Reaplica os headers de CORS para garantir que não sejam sobrescritos
	//res.header('Access-Control-Allow-Origin', '*');
	//res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
		//res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, devicetoken, appauth, access-control-allow-methods, Access-Control-Allow-Methods, deviceid, access-control-allow-origin, revenuecatuserid, access-control-allow-headers, a1-aegis-key, baseurl');
		/*
		response.data.pipe(res);
		response.data.on('end', () => {
			console.log(`[PROXY] Sucesso: resposta enviada para origem: ${origin} | Endpoint: ${url}`);
		});
		response.data.on('error', (err) => {
			console.log('[PROXY] Erro ao enviar resposta para origem:', err);
		});
		
		*/
	} catch (error) {
		console.log(`[PROXY] Erro na requisição para API externa no endpoint: ${url}`);
		console.log('[PROXY] Mensagem do erro:', error.message);
		res.status(error.response?.status || 500)
	}
})

const PORT = 4001|| process.env.PORT_ALTERNATIVE;
app.listen(PORT, () => {
	const now = new Date();
	const dataHora = now.toLocaleString('pt-BR', { hour12: false });
	const segundos = String(now.getSeconds()).padStart(2, '0');
	console.log(`Proxy rodando na porta ${PORT} | ${dataHora}:${segundos}`);
});
