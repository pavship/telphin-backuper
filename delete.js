const fromDateTime = '2019-04-09 00:00:00'
const toDateTime = '2019-05-10 00:00:00'

const qs = require('qs')
require('dotenv').config()

const axios = require('axios')

const baseURL = 'https://apiproxy.telphin.ru'

const connect = async () => {
	try {
		const res = await axios.post(baseURL + '/oauth/token?' +
			qs.stringify({
				client_id: process.env.TELPHIN_APP_ID,
				client_secret: process.env.TELPHIN_APP_SECRET,
				grant_type: 'client_credentials'
			})
		)
		return res.data.access_token
	} catch (err) {
		console.log('err > ', err)
	}
}

const execute = async () => {
	try {
		const token = await connect()
		const recordBaseUrl = 'https://apiproxy.telphin.ru/api/ver1.0/client/@me/record/'
		const { data } = await axios.delete(
			recordBaseUrl + '?start_datetime=' + fromDateTime + '&end_datetime=' + toDateTime,
			{ headers: { 'authorization': 'Bearer ' + token } }
		)
		console.log('data > ', data)
		// console.log('records > ', records)
		// console.log('records.length > ', records.length)
	} catch (err) {
		console.log('err > ', err)
	}
}

execute()
