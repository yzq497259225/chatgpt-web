import redis from 'redis'
import { promisify } from 'util'

const client = redis.createClient({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, password: process.env.REDIS_PWD })
const getAsync = promisify(client.get).bind(client)

const auth = async (req, res, next) => {
	try {
		const Authorization = req.header('Authorization')
		if (!Authorization) throw new Error('Error: 无访问权限 | No access rights')
		const AUTH_SECRET_KEY = await getAsync(Authorization.replace('Bearer ', '').trim())
		console.log("authKey: ", Authorization.replace('Bearer ', '').trim())
		if (!AUTH_SECRET_KEY) throw new Error('Error: 无访问权限 | No access rights')
		next()
	} catch (error) {
		res.send({ status: 'Unauthorized', message: error.message ?? 'Please authenticate.', data: null })
	}
}

export { auth }
