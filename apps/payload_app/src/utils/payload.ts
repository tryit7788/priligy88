import { getPayload } from 'payload'
import config from '../payload.config'
export const payload = async () => {
    const payloadConfig = await config
    return await getPayload({ config: payloadConfig })
}