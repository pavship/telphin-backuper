const fromDateTime = '2019-05-18 00:00:00'
const toDateTime = '2019-05-19 00:00:00'

const qs = require('qs')
require('dotenv').config()

const { createWriteStream, promises: fsp } = require('fs')
const downloadPath = './records'

const storeUpload = async ( stream, path ) => {
  return new Promise((resolve, reject) =>
    stream
      .pipe(createWriteStream(path))
      .on('finish', resolve)
      .on('error', reject),
  )
}

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
		const { data: records } = await axios.get(
			recordBaseUrl + '?start_datetime=' + fromDateTime + '&end_datetime=' + toDateTime,
			{ headers: { 'authorization': 'Bearer ' + token } }
		)
		// console.log('records > ', records)
		// console.log('records.length > ', records.length)
		await Promise.all(records.map( async ({
			record_uuid,
			start_time_gmt,
			flow,
			from_username,
			to_username
		}) => {
			const { data: { record_url } } = await axios.get(
				'https://apiproxy.telphin.ru/api/ver1.0/client/@me/record/' + record_uuid + '/storage_url/',
				{ headers: { 'authorization': 'Bearer ' + token } }
			)
			const { data: stream } = await axios.get( record_url, { responseType: 'stream'} )
			const localDateTime = new Date(Date.parse(start_time_gmt) + 2*10800000).toISOString().slice(0,-5).replace('T',' ').replace(/:/g,'-')
			return storeUpload(stream, downloadPath + `/${localDateTime}_${flow === 'in' ? from_username : to_username}.mp3`)
		}))
	} catch (err) {
		console.log('err > ', err)
	}
}

execute()
