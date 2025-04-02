import axios from 'axios';
import { 
  LiveCategory, 
  LiveStream, 
  VodCategory, 
  VodStream, 
  VodInfo, 
  SeriesCategory, 
  Series, 
  SeriesInfo, 
  Season as SeriesSeason,
  Episode as SeriesEpisode,
  EPGShort, 
  EPGSimpleDate 
} from '../types';

class XtreamAPI {
  private username: string = '';
  private password: string = '';
  private baseUrl: string = '';
  private isAuthenticated: boolean = false;

  // Initialize API with credentials
  public initialize(username: string, password: string, serverUrl: string): void {
    this.username = username;
    this.password = password;
    this.baseUrl = serverUrl;
    this.isAuthenticated = true;
  }

  // Reset API credentials
  public reset(): void {
    this.username = '';
    this.password = '';
    this.baseUrl = '';
    this.isAuthenticated = false;
  }

  // Check if API is initialized
  public isInitialized(): boolean {
    return this.isAuthenticated;
  }

  // Helper method to get full API URL
  private getApiUrl(action: string, params: Record<string, string | number> = {}): string {
    const baseApiUrl = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}`;
    const queryParams = Object.entries(params)
      .map(([key, value]) => `&${key}=${value}`)
      .join('');
    
    return `${baseApiUrl}&action=${action}${queryParams}`;
  }

  // Get base URL of the API
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  // Get username of the current user
  public getUsername(): string {
    return this.username;
  }

  // Get streaming URL for live channel
  public getLiveStreamingUrl(streamId: number): string {
    return `${this.baseUrl}/live/${this.username}/${this.password}/${streamId}.m3u8`;
  }

  // Get streaming URL for VOD with format
  public getVodStreamingUrl(streamId: number, format: 'mp4' | 'm3u8' | 'ts' = 'm3u8'): string {
    return `${this.baseUrl}/movie/${this.username}/${this.password}/${streamId}.${format}`;
  }

  // Get streaming URL for series episode with format
  public getSeriesStreamingUrl(streamId: number, format: 'mp4' | 'm3u8' | 'ts' = 'm3u8'): string {
    return `${this.baseUrl}/series/${this.username}/${this.password}/${streamId}.${format}`;
  }

  // Authentication - Test if credentials are valid
  public async authenticate(): Promise<boolean> {
    try {
      const response = await axios.get(this.getApiUrl('get_live_categories'));
      return response.status === 200;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  // Live TV Methods
  public async getLiveCategories(): Promise<LiveCategory[]> {
    try {
      const response = await axios.get(this.getApiUrl('get_live_categories'));
      return response.data;
    } catch (error) {
      console.error('Error fetching live categories:', error);
      return [];
    }
  }

  public async getLiveStreams(categoryId?: string): Promise<LiveStream[]> {
    try {
      const params: Record<string, string | number> = {};
      if (categoryId) {
        params.category_id = categoryId;
      }
      const response = await axios.get(this.getApiUrl('get_live_streams', params));
      return response.data;
    } catch (error) {
      console.error('Error fetching live streams:', error);
      return [];
    }
  }

  // VOD Methods
  public async getVodCategories(): Promise<VodCategory[]> {
    try {
      const response = await axios.get(this.getApiUrl('get_vod_categories'));
      return response.data;
    } catch (error) {
      console.error('Error fetching VOD categories:', error);
      return [];
    }
  }

  public async getVodStreams(categoryId?: string): Promise<VodStream[]> {
    try {
      const params: Record<string, string | number> = {};
      if (categoryId) {
        params.category_id = categoryId;
      }
      const response = await axios.get(this.getApiUrl('get_vod_streams', params));
      return response.data;
    } catch (error) {
      console.error('Error fetching VOD streams:', error);
      return [];
    }
  }

  public async getVodInfo(vodId: number): Promise<VodInfo | null> {
    try {
      const response = await axios.get(this.getApiUrl('get_vod_info', { vod_id: vodId }));
      return response.data;
    } catch (error) {
      console.error('Error fetching VOD info:', error);
      return null;
    }
  }

  // Series Methods
  public async getSeriesCategories(): Promise<SeriesCategory[]> {
    try {
      const response = await axios.get(this.getApiUrl('get_series_categories'));
      return response.data;
    } catch (error) {
      console.error('Error fetching series categories:', error);
      return [];
    }
  }

  public async getSeries(categoryId?: string): Promise<Series[]> {
    try {
      const params: Record<string, string | number> = {};
      if (categoryId) {
        params.category_id = categoryId;
      }
      const response = await axios.get(this.getApiUrl('get_series', params));
      return response.data;
    } catch (error) {
      console.error('Error fetching series:', error);
      return [];
    }
  }

  public async getSeriesInfo(seriesId: number): Promise<SeriesInfo | null> {
    try {
      const response = await axios.get(this.getApiUrl('get_series_info', { series_id: seriesId }));
      return response.data;
    } catch (error) {
      console.error('Error fetching series info:', error);
      return null;
    }
  }

  // Get seasons for a series
  public async getSeriesSeasons(seriesId: number): Promise<SeriesSeason[]> {
    try {
      const seriesInfo = await this.getSeriesInfo(seriesId);
      return seriesInfo?.seasons || [];
    } catch (error) {
      console.error('Error fetching series seasons:', error);
      return [];
    }
  }

  // Get episodes for a specific season of a series
  public async getSeriesEpisodes(seriesId: number, seasonNumber: number): Promise<SeriesEpisode[]> {
    try {
      const seriesInfo = await this.getSeriesInfo(seriesId);
      if (!seriesInfo || !seriesInfo.episodes) {
        return [];
      }
      
      // Convert season number to string as that's how it's indexed in the API response
      const seasonKey = seasonNumber.toString();
      return seriesInfo.episodes[seasonKey] || [];
    } catch (error) {
      console.error('Error fetching series episodes:', error);
      return [];
    }
  }

  // EPG Methods
  public async getShortEPG(streamId: number, limit: number = 4): Promise<EPGShort[]> {
    try {
      const response = await axios.get(this.getApiUrl('get_short_epg', { stream_id: streamId, limit }));
      return response.data.epg_listings;
    } catch (error) {
      console.error('Error fetching short EPG:', error);
      return [];
    }
  }

  public async getSimpleDateEPG(streamId: number): Promise<EPGSimpleDate | null> {
    try {
      const response = await axios.get(this.getApiUrl('get_simple_data_table', { stream_id: streamId }));
      return response.data;
    } catch (error) {
      console.error('Error fetching simple date EPG:', error);
      return null;
    }
  }

  // Get full M3U playlist
  public getM3UPlaylistUrl(): string {
    return `${this.baseUrl}/get.php?username=${this.username}&password=${this.password}&type=m3u_plus&output=ts`;
  }
  
  // Get account information including expiration date, status, and more
  public async getAccountInfo(): Promise<any> {
    try {
      const response = await axios.get(this.getApiUrl('user', { username: this.username }));
      console.log('Raw API response:', JSON.stringify(response.data));
      
      // Check various possible response formats
      let userData = null;
      
      if (response.data?.user) {
        // Standard format
        userData = response.data.user;
      } else if (response.data?.result === "success" && response.data?.data) {
        // Alternative format some providers use
        userData = response.data.data;
      } else if (response.data && typeof response.data === 'object') {
        // Some APIs return the user data directly
        userData = response.data;
      }
      
      if (!userData) {
        console.error('Unable to parse account info from response:', response.data);
      }
      
      return userData;
    } catch (error) {
      console.error('Error fetching account info:', error);
      return null;
    }
  }

  // Get recommended headers for streaming
  public getStreamHeaders(): Record<string, string> {
    return {
      'User-Agent': 'VLC/3.0.0 LibVLC/3.0.0',
      'Referer': this.baseUrl,
    };
  }

  // Get full series details with improved parsing based on Dart model structure
  public async getSeriesDetails(seriesId: number): Promise<any> {
    try {
      console.log(`Fetching complete series details for ID: ${seriesId}`);
      
      // Try the standard endpoint first (series parameter)
      let response = await axios.get(this.getApiUrl('get_series_info', { series: seriesId }));
      console.log('Series details raw response structure:', 
        Object.keys(response.data || {}),
        'Has episodes:', !!response.data?.episodes,
        'Has season:', !!response.data?.season
      );
      
      // Normalize the response to match the Dart model structure
      let normalizedData: any = {
        info: null,
        seasons: [],
        episodes: {}
      };
      
      if (!response.data) {
        throw new Error('Empty API response');
      }
      
      // Parse info
      if (response.data.info) {
        normalizedData.info = response.data.info;
      } else if (typeof response.data === 'object' && response.data.name) {
        // Some providers put info at the root level
        normalizedData.info = response.data;
      }
      
      // Parse seasons (note: in Dart it's 'season' singular, not 'seasons' plural)
      if (response.data.season && Array.isArray(response.data.season)) {
        normalizedData.seasons = response.data.season;
      } else if (response.data.seasons && Array.isArray(response.data.seasons)) {
        normalizedData.seasons = response.data.seasons;
      } else {
        // Try to create seasons from episodes keys if available
        if (response.data.episodes && typeof response.data.episodes === 'object') {
          const seasonKeys = Object.keys(response.data.episodes);
          console.log('Creating seasons from episode keys:', seasonKeys);
          
          normalizedData.seasons = seasonKeys.map(key => {
            const episodes = response.data.episodes[key] || [];
            return {
              air_date: '',
              episode_count: episodes.length,
              id: parseInt(key, 10),
              name: `Season ${key}`,
              overview: '',
              season_number: parseInt(key, 10),
              cover: normalizedData.info?.cover || '',
              cover_big: normalizedData.info?.cover || ''
            };
          });
        }
      }
      
      // Parse episodes map (season number -> episodes list)
      if (response.data.episodes && typeof response.data.episodes === 'object') {
        normalizedData.episodes = response.data.episodes;
      } else {
        // Try alternative structures
        // Some providers use 'episode' instead of 'episodes'
        if (response.data.episode && typeof response.data.episode === 'object') {
          normalizedData.episodes = response.data.episode;
        }
        
        // If still no episodes found, try to fetch each season episodes
        if (Object.keys(normalizedData.episodes).length === 0 && normalizedData.seasons.length > 0) {
          console.log('No episodes found in response, trying to fetch each season separately');
          
          // Create an empty episodes map
          normalizedData.episodes = {};
          
          // For each season, try to fetch its episodes
          for (const season of normalizedData.seasons) {
            const seasonNumber = season.season_number;
            try {
              // Use our existing method to get episodes for this season
              const episodes = await this.getSeriesEpisodes(seriesId, seasonNumber);
              if (episodes.length > 0) {
                normalizedData.episodes[seasonNumber] = episodes;
              }
            } catch (error) {
              console.error(`Failed to fetch episodes for season ${seasonNumber}:`, error);
            }
          }
        }
      }
      
      console.log(`Normalized series details: info=${!!normalizedData.info}, ` +
                  `seasons=${normalizedData.seasons.length}, ` +
                  `episodes keys=${Object.keys(normalizedData.episodes).length}`);
      
      return normalizedData;
    } catch (error) {
      console.error('Error fetching series details:', error);
      return null;
    }
  }

  // Get episodes for a specific season using the improved series details structure
  public async getSeriesEpisodesImproved(seriesId: number, seasonNumber: number): Promise<SeriesEpisode[]> {
    try {
      console.log(`Fetching episodes improved for Series ID: ${seriesId}, Season: ${seasonNumber}`);
      
      // First try our existing method which already includes NOBRIDGE format support
      const episodes = await this.getSeriesEpisodes(seriesId, seasonNumber);
      if (episodes.length > 0) {
        return episodes;
      }
      
      // If that fails, try to get full series details
      const seriesDetails = await this.getSeriesDetails(seriesId);
      if (!seriesDetails) {
        console.error('Failed to fetch series details');
        return [];
      }
      
      // Look for episodes in the specified season
      const seasonKey = seasonNumber.toString();
      if (seriesDetails.episodes && seriesDetails.episodes[seasonKey]) {
        const seasonEpisodes = seriesDetails.episodes[seasonKey];
        console.log(`Found ${seasonEpisodes.length} episodes for season ${seasonNumber} in series details`);
        return seasonEpisodes;
      }
      
      console.log('No episodes found in series details');
      return [];
    } catch (error) {
      console.error('Error fetching improved series episodes:', error);
      return [];
    }
  }

  // Get movie details with improved parsing based on the Dart model structure
  public async getMovieDetailsImproved(movieId: number): Promise<any> {
    try {
      console.log(`Fetching improved movie details for ID: ${movieId}`);
      
      // Try the standard endpoint first
      let response = await axios.get(this.getApiUrl('get_vod_info', { vod_id: movieId }));
      console.log('Movie details raw response structure:', 
        Object.keys(response.data || {}),
        'Has info:', !!response.data?.info,
        'Has movie_data:', !!response.data?.movie_data
      );
      
      if (!response.data) {
        throw new Error('Empty API response');
      }
      
      // Some providers use different structures, normalize according to the Dart model
      let normalizedData: any = {
        info: null,
        movie_data: null
      };
      
      // Handle info object
      if (response.data.info && typeof response.data.info === 'object') {
        normalizedData.info = response.data.info;
      } else if (response.data.info_x && typeof response.data.info_x === 'object') {
        // Some providers use info_x instead of info
        normalizedData.info = response.data.info_x;
      } else if (typeof response.data === 'object' && response.data.movie_image) {
        // Some providers put info directly at the root level
        normalizedData.info = {
          movie_image: response.data.movie_image,
          plot: response.data.plot,
          cast: response.data.cast,
          director: response.data.director,
          genre: response.data.genre,
          releasedate: response.data.releasedate,
          duration: response.data.duration,
          rating: response.data.rating,
          backdrop_path: response.data.backdrop_path
        };
      }
      
      // Handle movie_data object
      if (response.data.movie_data && typeof response.data.movie_data === 'object') {
        normalizedData.movie_data = response.data.movie_data;
      } else if (typeof response.data === 'object' && response.data.stream_id) {
        // Some providers return the movie data at the root level
        normalizedData.movie_data = {
          stream_id: response.data.stream_id,
          name: response.data.name,
          added: response.data.added,
          category_id: response.data.category_id,
          container_extension: response.data.container_extension,
          custom_sid: response.data.custom_sid,
          direct_source: response.data.direct_source
        };
      }
      
      // If we couldn't find movie_data but have the movie ID, create minimal movie_data
      if (!normalizedData.movie_data && movieId) {
        normalizedData.movie_data = {
          stream_id: movieId.toString()
        };
      }
      
      // For video details
      if (response.data.info?.video) {
        normalizedData.info.video = response.data.info.video;
      }
      
      console.log(`Normalized movie details: info=${!!normalizedData.info}, movie_data=${!!normalizedData.movie_data}`);
      
      return normalizedData;
    } catch (error) {
      console.error('Error fetching improved movie details:', error);
      return null;
    }
  }
  
  // Get stream format based on container_extension
  private getPreferredStreamFormat(containerExtension: string): 'mp4' | 'm3u8' | 'ts' {
    if (!containerExtension) return 'm3u8'; // Default format
    
    const ext = containerExtension.toLowerCase();
    if (ext === 'mp4') return 'mp4';
    if (ext === 'ts') return 'ts';
    return 'm3u8'; // Default to m3u8 for compatibility
  }
  
  // Get optimal streaming URL for movie with fallbacks
  public getOptimalMovieStreamingUrl(movieDetails: any): string {
    if (!movieDetails) return '';
    
    const streamId = movieDetails.movie_data?.stream_id;
    if (!streamId) return '';
    
    // Get container extension from movie details if available
    const containerExtension = movieDetails.movie_data?.container_extension || '';
    const format = this.getPreferredStreamFormat(containerExtension);
    
    // If there's a direct source URL, use it
    if (movieDetails.movie_data?.direct_source) {
      const directSource = movieDetails.movie_data.direct_source;
      console.log(`Using direct source URL: ${directSource}`);
      return directSource;
    }
    
    // Otherwise, construct URL based on container extension
    const streamUrl = this.getVodStreamingUrl(parseInt(streamId, 10), format);
    console.log(`Generated stream URL with format ${format}: ${streamUrl}`);
    return streamUrl;
  }
}

// Export a singleton instance
export const xtreamApi = new XtreamAPI(); 