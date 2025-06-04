import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  constructGoogleSearchQuery,
  fetchRawGoogleSearchResults,
} from './googleCSE.js'
import type { LangfuseTraceClient, LangfuseSpanClient } from 'langfuse'

vi.mock('./tools.js', () => ({
  googleSearchTool: {
    invoke: vi.fn(),
  },
}))

import { googleSearchTool } from './tools.js'

describe('googleCSE', () => {
  describe('constructGoogleSearchQuery', () => {
    it('should construct a query with field of interest and city name', () => {
      const fieldOfInterest = 'AI conferences'
      const cityName = 'San Francisco'
      const expectedQuery = '"AI conferences" events in "San Francisco"'
      expect(constructGoogleSearchQuery(fieldOfInterest, cityName)).toBe(
        expectedQuery
      )
    })

    it('should throw an error if fieldOfInterest is empty', () => {
      expect(() => constructGoogleSearchQuery('', 'London')).toThrow(
        'Field of interest cannot be empty.'
      )
    })

    it('should throw an error if cityName is empty', () => {
      expect(() => constructGoogleSearchQuery('Tech Meetups', '')).toThrow(
        'City name cannot be empty.'
      )
    })

    it('should throw an error if both fieldOfInterest and cityName are empty', () => {
      expect(() => constructGoogleSearchQuery('', '')).toThrow(
        'Field of interest cannot be empty.'
      )
    })

    it('should handle inputs with spaces correctly when both inputs are valid', () => {
      const fieldOfInterest = 'Web Development Workshops'
      const cityName = 'New York City'
      const expectedQuery =
        '"Web Development Workshops" events in "New York City"'
      expect(constructGoogleSearchQuery(fieldOfInterest, cityName)).toBe(
        expectedQuery
      )
    })
  })

  describe('fetchRawGoogleSearchResults', () => {
    let mockTrace: LangfuseTraceClient
    let mockSpan: LangfuseSpanClient

    beforeEach(() => {
      vi.resetAllMocks()

      mockSpan = {
        update: vi.fn(),
        end: vi.fn(),
      } as unknown as LangfuseSpanClient

      mockTrace = {
        span: vi.fn(() => mockSpan),
      } as unknown as LangfuseTraceClient
    })

    it('should fetch results and trace with Langfuse when parentTrace is provided', async () => {
      const query = 'test query'
      const mockResults = 'some search results'
      ;(googleSearchTool.invoke as vi.Mock).mockResolvedValue(mockResults)

      const results = await fetchRawGoogleSearchResults(query, mockTrace)

      expect(results).toBe(mockResults)
      expect(mockTrace.span).toHaveBeenCalledWith({
        name: 'google-custom-search-invoke',
        input: { query },
        metadata: {
          tool: 'GoogleCustomSearch',
          service: 'Google Custom Search Engine',
        },
      })
      expect(mockSpan.update).toHaveBeenCalledWith({ output: mockResults })
      expect(mockSpan.end).toHaveBeenCalled()
      expect(googleSearchTool.invoke).toHaveBeenCalledWith(query)
    })

    it('should fetch results without Langfuse tracing when parentTrace is null', async () => {
      const query = 'test query no trace'
      const mockResults = 'search results no trace'
      ;(googleSearchTool.invoke as vi.Mock).mockResolvedValue(mockResults)

      const results = await fetchRawGoogleSearchResults(query, null)

      expect(results).toBe(mockResults)
      expect(mockTrace.span).not.toHaveBeenCalled()
      expect(googleSearchTool.invoke).toHaveBeenCalledWith(query)
    })

    it('should fetch results without Langfuse tracing when parentTrace is undefined', async () => {
      const query = 'test query no trace undefined'
      const mockResults = 'search results no trace undefined'
      ;(googleSearchTool.invoke as vi.Mock).mockResolvedValue(mockResults)

      const results = await fetchRawGoogleSearchResults(query, undefined)

      expect(results).toBe(mockResults)
      expect(mockTrace.span).not.toHaveBeenCalled()
      expect(googleSearchTool.invoke).toHaveBeenCalledWith(query)
    })

    it('should handle errors from googleSearchTool.invoke and trace with Langfuse', async () => {
      const query = 'error query'
      const errorMessage = 'API Error'
      ;(googleSearchTool.invoke as vi.Mock).mockRejectedValue(
        new Error(errorMessage)
      )

      await expect(
        fetchRawGoogleSearchResults(query, mockTrace)
      ).rejects.toThrow(errorMessage)

      expect(mockTrace.span).toHaveBeenCalledWith({
        name: 'google-custom-search-invoke',
        input: { query },
        metadata: {
          tool: 'GoogleCustomSearch',
          service: 'Google Custom Search Engine',
        },
      })
      expect(mockSpan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'ERROR',
          statusMessage: errorMessage,
        })
      )
      expect(mockSpan.end).toHaveBeenCalled()
    })

    it('should handle non-Error objects thrown by googleSearchTool.invoke and trace with Langfuse', async () => {
      const query = 'non-error object query'
      const errorObject = { message: 'Non-Error Thrown' }
      ;(googleSearchTool.invoke as vi.Mock).mockRejectedValue(errorObject)

      await expect(
        fetchRawGoogleSearchResults(query, mockTrace)
      ).rejects.toThrow(String(errorObject))

      expect(mockTrace.span).toHaveBeenCalled()
      expect(mockSpan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'ERROR',
          statusMessage: 'Invoke failed',
        })
      )
      expect(mockSpan.end).toHaveBeenCalled()
    })

    it('should handle errors from googleSearchTool.invoke without Langfuse tracing', async () => {
      const query = 'error query no trace'
      const errorMessage = 'API Error no trace'
      ;(googleSearchTool.invoke as vi.Mock).mockRejectedValue(
        new Error(errorMessage)
      )

      await expect(fetchRawGoogleSearchResults(query, null)).rejects.toThrow(
        errorMessage
      )
      expect(mockTrace.span).not.toHaveBeenCalled()
    })

    it('should handle unexpected non-string results and trace with Langfuse', async () => {
      const query = 'unexpected type query'
      const unexpectedResults = { data: 'not a string' }
      ;(googleSearchTool.invoke as vi.Mock).mockResolvedValue(unexpectedResults)

      await expect(
        fetchRawGoogleSearchResults(query, mockTrace)
      ).rejects.toThrow(
        `GoogleCustomSearch tool returned an unexpected type: ${typeof unexpectedResults}. Expected string. Output: ${JSON.stringify(unexpectedResults)}`
      )

      expect(mockTrace.span).toHaveBeenCalled()
      expect(mockSpan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'ERROR',
          statusMessage: 'Unexpected output type from tool',
          output: expect.objectContaining({ data: unexpectedResults }),
        })
      )
      expect(mockSpan.end).toHaveBeenCalled()
    })

    it('should handle unexpected non-string results without Langfuse tracing', async () => {
      const query = 'unexpected type query no trace'
      const unexpectedResults = { data: 'not a string again' }
      ;(googleSearchTool.invoke as vi.Mock).mockResolvedValue(unexpectedResults)

      await expect(fetchRawGoogleSearchResults(query, null)).rejects.toThrow(
        `GoogleCustomSearch tool returned an unexpected type: ${typeof unexpectedResults}. Expected string. Output: ${JSON.stringify(unexpectedResults)}`
      )
      expect(mockTrace.span).not.toHaveBeenCalled()
    })
  })
})
