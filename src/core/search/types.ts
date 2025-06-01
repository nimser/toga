export interface CityWithRadius {
  cityName: string
  radius?: number
}

export interface SearchInputParameters {
  fieldOfInterest: string
  locations?: CityWithRadius[]
}

export interface EventDetails {
  id: string
  title: string
  description?: string
  date?: string
  time?: string
  location?: string
  city?: string
  source: string
  relevanceScore?: number
  rawResult?: object
}
