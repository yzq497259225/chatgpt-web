import express from 'express'
import type { RequestProps } from './types'
import type { ChatMessage } from './chatgpt'
import { chatConfig, chatReplyProcess, currentModel } from './chatgpt'
import { auth } from './middleware/auth'
import { limiter } from './middleware/limiter'
import { isNotEmptyString } from './utils/is'
import redis from 'redis'
import { promisify } from 'util'

const app = express()
const router = express.Router()

const client = redis.createClient({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, password: process.env.REDIS_PWD })
const getAsync = promisify(client.get).bind(client)

app.use(express.static('public'))
app.use(express.json())

app.all('*', (_, res, next) => {
	res.header('Access-Control-Allow-Origin', '*')
	res.header('Access-Control-Allow-Headers', 'authorization, Content-Type')
	res.header('Access-Control-Allow-Methods', '*')
	next()
})

router.post('/chat-process', [auth, limiter], async (req, res) => {
	res.setHeader('Content-type', 'application/octet-stream')

	try {
		const { prompt, options = {}, systemMessage } = req.body as RequestProps
		let firstChunk = true
		await chatReplyProcess({
			message: prompt,
			lastContext: options,
			process: (chat: ChatMessage) => {
				res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
				firstChunk = false
			},
			systemMessage,
		})
	}
	catch (error) {
		res.write(JSON.stringify(error))
	}
	finally {
		res.end()
	}
})

router.post('/config', async (req, res) => {
	try {
		const Authorization = req.header('Authorization')
		const key = Authorization.replace('Bearer ', '').trim()
		console.log("authKey: ", key)
		const response = await chatConfig(key)
		res.send(response)
	}
	catch (error) {
		res.send(error)
	}
})

router.post('/session', async (req, res) => {
	try {
		const AUTH_SECRET_KEYS = process.env.AUTH_SECRET_KEYS
		const hasAuth = isNotEmptyString(AUTH_SECRET_KEYS)
		res.send({ status: 'Success', message: '', data: { auth: hasAuth, model: currentModel() } })
	}
	catch (error) {
		res.send({ status: 'Fail', message: error.message, data: null })
	}
})

router.post('/verify', async (req, res) => {
	try {
		const { token } = req.body as { token: string }
		if (!token)
			throw new Error('密钥为空 | Secret key is empty')
		const AUTH_SECRET_KEY = await getAsync(token)
		if (!AUTH_SECRET_KEY){
			throw new Error('密钥无效 | Secret key is invalid')
		}else if(AUTH_SECRET_KEY > 0) {
			res.send({ status: 'Success', message: '验证成功 | Verify successfully', data: null })
		}else {
			throw new Error('访问次数用完 | Maximum access exceeded')
		}
	} catch (error) {
		res.send({ status: 'Fail', message: error.message, data: null })
	}
})

app.use('', router)
app.use('/api', router)
app.set('trust proxy', 1)

app.listen(3002, () => globalThis.console.log('Server is running on port 3002'))
