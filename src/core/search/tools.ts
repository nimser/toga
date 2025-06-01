import { GoogleCustomSearch } from '@langchain/community/tools/google_custom_search'
import 'dotenv/config'

const apiKey = process.env.GOOGLE_API_KEY
const cseId = process.env.GOOGLE_CSE_ID

if (!apiKey || !cseId) {
  throw new Error('GOOGLE_API_KEY or GOOGLE_CSE_ID is not set. Aborting.')
}

export const googleSearchTool = new GoogleCustomSearch({
  apiKey: apiKey,
  googleCSEId: cseId,
})
