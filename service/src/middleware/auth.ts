import redis from 'redis'
import { promisify } from 'util'

const client = redis.createClient({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, password: process.env.REDIS_PWD })
const getAsync = promisify(client.get).bind(client)
const decrAsync = promisify(client.decr).bind(client)

const auth = async (req, res, next) => {
	try {
		const Authorization = req.header('Authorization')
		if (!Authorization) throw new Error('Error: 无访问权限 | No access rights')
		const key = Authorization.replace('Bearer ', '').trim()
		const AUTH_SECRET_KEY = await getAsync(key)
		console.log("authKey: ", key)
		if (!AUTH_SECRET_KEY) throw new Error('Error: 无访问权限 | No access rights')
		if (parseInt(AUTH_SECRET_KEY) > 0) {
			await decrAsync(key)
		} else {
			throw new Error('Error: 访问次数已用完 | Access times have been used up')
		}
		next()
	} catch (error) {
		res.send({ status: 'Unauthorized', message: error.message ?? 'Please authenticate.', data: null })
	}
}

export { auth }
