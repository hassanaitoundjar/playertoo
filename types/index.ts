// User Authentication Types
export interface AuthCredentials {
  username: string;
  password: string;
  server_url: string;
}

export interface User {
  username: string;
  password: string;
  server_url: string;
  status: 'authenticated' | 'unauthenticated' | 'loading';
  message?: string;
}

// Live TV Types
export interface LiveCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface LiveStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  is_adult: string;
  category_id: string;
  category_ids: string[];
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

// VOD Types
export interface VodCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface VodStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  added: string;
  category_id: string;
  category_ids: string[];
  container_extension: string;
  custom_sid: string;
  direct_source: string;
  plot?: string;
}

export interface VodInfo {
  info: {
    movie_image: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    releaseDate: string;
    duration: string;
    rating: string;
  };
  movie_data: VodStream;
}

// Series Types
export interface SeriesCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface Series {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  releaseDate: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  backdrop_path: string[];
  youtube_trailer: string;
  episode_run_time: string;
  category_id: string;
}

export interface SeriesInfo {
  info: Series;
  episodes: {
    [seasonNumber: string]: Episode[];
  };
  seasons: Season[];
}

export interface Season {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  season_number: number;
  cover: string;
  cover_big: string;
}

export interface Episode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info: {
    movie_image: string;
    plot: string;
    duration_secs: number;
    duration: string;
    releasedate: string;
    rating: string;
  };
  added: string;
  season: number;
  direct_source: string;
}

// Add type aliases to match the imports in services/api.ts
export type SeriesSeason = Season;
export type SeriesEpisode = Episode;

// EPG Types
export interface EPGShort {
  epg_id: string;
  title: string;
  lang: string;
  start: string;
  end: string;
  description: string;
  channel_id: string;
  start_timestamp: number;
  stop_timestamp: number;
}

export interface EPGSimpleDate {
  [date: string]: EPGShort[];
}

// Favorite Types
export interface FavoriteItem {
  id: number;
  type: 'live' | 'vod' | 'series';
  name: string;
  stream_icon?: string;
  cover?: string;
}

// History Types
export interface WatchHistoryItem {
  id: number;
  type: 'live' | 'vod' | 'series';
  name: string;
  stream_icon?: string;
  cover?: string;
  position?: number; // For VOD and Series to remember playback position
  timestamp: number;
  series_id?: number;
  season?: number;
  episode_num?: number;
}

// MovieDetail interfaces based on Dart model
export interface MovieDetail {
  info?: MovieInfo;
  movie_data?: MovieData;
}

export interface MovieInfo {
  movie_image?: string;
  tmdb_id?: string;
  backdrop?: string;
  youtube_trailer?: string;
  genre?: string;
  plot?: string;
  cast?: string;
  rating?: string;
  director?: string;
  releasedate?: string;
  backdrop_path?: string[];
  duration_secs?: string;
  duration?: string;
  video?: MovieVideo;
  bitrate?: string;
}

export interface MovieVideo {
  index?: string;
  codec_name?: string;
  codec_long_name?: string;
  profile?: string;
  codec_type?: string;
  codec_time_base?: string;
  codec_tag_string?: string;
  codec_tag?: string;
  width?: string;
  height?: string;
  coded_width?: string;
  coded_height?: string;
  has_b_frames?: string;
  sample_aspect_ratio?: string;
  display_aspect_ratio?: string;
  pix_fmt?: string;
  level?: string;
  color_range?: string;
  color_space?: string;
  color_transfer?: string;
  color_primaries?: string;
  chroma_location?: string;
  refs?: string;
  is_avc?: string;
  nal_length_size?: string;
  r_frame_rate?: string;
  avg_frame_rate?: string;
  time_base?: string;
  start_pts?: string;
  start_time?: string;
  duration_ts?: string;
  duration?: string;
  bit_rate?: string;
  bits_per_raw_sample?: string;
  nb_frames?: string;
  tags?: MovieVideoTags;
}

export interface MovieVideoTags {
  language?: string;
  handler_name?: string;
}

export interface MovieData {
  stream_id?: string;
  name?: string;
  added?: string;
  category_id?: string;
  container_extension?: string;
  custom_sid?: string;
  direct_source?: string;
} 