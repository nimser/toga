import { googleSearchTool } from './tools.js'
import type { LangfuseTraceClient, LangfuseSpanClient } from 'langfuse'

export async function fetchRawGoogleSearchResults(
  query: string,
  parentTrace?: LangfuseTraceClient | null
): Promise<string> {
  let cseSpan: LangfuseSpanClient | undefined = undefined
  if (parentTrace) {
    cseSpan = parentTrace.span({
      name: 'google-custom-search-invoke',
      input: { query },
      metadata: {
        tool: 'GoogleCustomSearch',
        service: 'Google Custom Search Engine',
      },
    })
  }

  let resultsString: unknown
  try {
    resultsString = await googleSearchTool.invoke(query)
  } catch (invokeError) {
    console.error('Error during googleSearchTool.invoke():', invokeError)
    if (cseSpan) {
      cseSpan.update({
        level: 'ERROR',
        statusMessage:
          invokeError instanceof Error ? invokeError.message : 'Invoke failed',
        output: {
          error:
            invokeError instanceof Error
              ? invokeError.stack
              : String(invokeError),
        },
      })
      cseSpan.end()
    }
    if (invokeError instanceof Error) {
      throw invokeError
    } else {
      throw new Error(String(invokeError))
    }
  }

  if (typeof resultsString !== 'string') {
    const typeErrorMsg = `GoogleCustomSearch tool returned an unexpected type: ${typeof resultsString}. Expected string. Output: ${JSON.stringify(resultsString)}`
    console.error(typeErrorMsg)
    if (cseSpan) {
      cseSpan.update({
        level: 'ERROR',
        statusMessage: 'Unexpected output type from tool',
        output: { error: typeErrorMsg, data: resultsString },
      })
      cseSpan.end()
    }
    throw new Error(typeErrorMsg)
  }

  if (cseSpan) {
    cseSpan.update({ output: resultsString })
    cseSpan.end()
  }
  return resultsString
}
