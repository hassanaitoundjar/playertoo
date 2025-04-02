# IPTV Player

A modern and responsive IPTV streaming application built with React Native and Expo.

## Features

- **Live TV**: Watch live TV channels with EPG support
- **Movies**: Stream VOD content
- **Series**: Watch TV series with season and episode navigation
- **Search**: Search across all content types (channels, movies, series)
- **Favorites**: Save your favorite content for quick access
- **Watch History**: Resume watching from where you left off
- **Dark/Light Theme**: Switch between dark and light themes
- **Offline Mode**: Gracefully handle connection loss with offline indicators
- **Responsive UI**: Works on both phone and tablet devices

## Technical Details

- Built with **React Native** and **Expo**
- **Expo Router** for navigation
- Supports **Xtream Codes API**
- Persistent storage with **AsyncStorage**
- Custom video player with full-screen support
- Theme context for dark/light mode switching
- Network status monitoring
- Responsive search functionality
- Error handling with feedback

## Getting Started

### Prerequisites

- Node.js (14.x or later)
- Expo CLI

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/iptv-player.git
   cd iptv-player
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npx expo start
   ```

### Usage

1. Launch the app
2. Enter your IPTV provider credentials (server URL, username, password)
3. Browse and enjoy your content
4. Use the search button in the header to search across all content
5. Check your watch history and favorites for quick access to content

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Expo team for their amazing framework
- React Native community for the great ecosystem
- All contributors who helped make this project better
