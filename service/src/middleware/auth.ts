import { isNotEmptyString } from '../utils/is'

const auth = async (req, res, next) => {
	const AUTH_SECRET_KEYS = process.env.AUTH_SECRET_KEYS.split(',')
	if (AUTH_SECRET_KEYS.length > 0) {
		try {
			const Authorization = req.header('Authorization')
			let isAuthorized = false
			for (const key of AUTH_SECRET_KEYS) {
				if (isNotEmptyString(key) && Authorization && Authorization.replace('Bearer ', '').trim() === key.trim()) {
					isAuthorized = true
					break
				}
			}
			if (!isAuthorized) throw new Error('Error: 无访问权限 | No access rights')
			next()
		}
		catch (error) {
			res.send({ status: 'Unauthorized', message: error.message ?? 'Please authenticate.', data: null })
		}
	}
	else {
		next()
	}
}

export { auth }
