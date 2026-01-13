require('dotenv').config();


const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

app.use(express.json());

// Mensagem ao acessar a raiz
app.get('/', (req, res) => {
	res.send('API rodando');
});

// Proxy genérico: repassa qualquer requisição para a API externa
app.use('/proxy/*', async (req, res) => {
	// Definindo headers CORS manualmente apenas para /proxy
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	// Responde a preflight OPTIONS
	if (req.method === 'OPTIONS') {
		return res.sendStatus(204);
	}
		const endpoint = req.params[0];
	const url = `https://appdev.antena1.com.br/${endpoint}`;
		const origin = req.headers.origin || 'Origem não informada';
		console.log('[PROXY] Início da requisição');
		console.log(`[PROXY] Requisição recebida: ${req.method} ${req.originalUrl} | Origin: ${origin}`);
		try {
		console.log('[PROXY] Fazendo requisição para API externa:', url);
		const requestHeaders = { ...req.headers, host: 'appdev.antena1.com.br' };
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
			res.status(error.response?.status || 500).json({ error: error.message, endpoint: url });
		}
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
	console.log(`Proxy rodando na porta ${PORT}`);
});
