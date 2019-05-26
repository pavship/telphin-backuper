const fromDateTime = '2019-04-11 14:51:38'
const toDateTime = '2019-04-11 15:51:38'

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
			return storeUpload(stream, downloadPath + `/${start_time_gmt.replace(/:/g,'-')}_${flow === 'in' ? from_username : to_username}.mp3`)
			// return storeUpload(stream, downloadPath + `/1.mp3`)
		}))
		// console.log('records[0] > ', records[0])
		// const { record_uuid } = records[0]
		// console.log('record_uuid > ', record_uuid)
		// const { data: { record_url } } = await axios.get(
		// 	'https://apiproxy.telphin.ru/api/ver1.0/client/@me/record/' + record_uuid + '/storage_url/',
		// 	{ headers: { 'authorization': 'Bearer ' + token } }
		// )
		// console.log('record_url > ', record_url)
		// const { data: stream } = await axios.get( record_url, { responseType: 'stream'} )
		// await storeUpload(stream, downloadPath + '/1.mp3')

	} catch (err) {
		console.log('err > ', err)
	}
}

execute()
