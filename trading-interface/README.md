# Dexonic Trading Assistant - Next.js Version

This is a Next.js version of the Vistia-Dexonic trading assistant application. It provides a modern, responsive trading interface with real-time data visualization and trading tools.

## Features

- **Real-time Trading Interface**: View live cryptocurrency prices and market data
- **Interactive Charts**: Price charts with technical indicators
- **Trading Agents**: AI-powered trading signals and automation
- **Token Swapping**: Built-in DEX functionality for token exchanges
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Professional dark UI optimized for trading

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Web3**: RainbowKit & Wagmi (for wallet integration)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
dexonic-nextjs/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Header.tsx         # Navigation header
│   ├── Main.tsx           # Main trading interface
│   ├── SlidebarLeft.tsx   # Left sidebar with charts
│   ├── SlidebarCenter.tsx # Center market overview
│   ├── SlidebarRight.tsx  # Right trading agents
│   ├── TableTime.tsx      # Time series data
│   └── Swap.tsx           # Token swap interface
├── public/                # Static assets
│   ├── icon/             # Token icons
│   └── img/              # UI images
└── package.json          # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Key Components

### Header

Navigation bar with logo, menu items, and wallet connection.

### Main

Central trading interface with search, time frame selection, and action buttons.

### SlidebarLeft

Detailed token information, price charts, and trading signals.

### SlidebarCenter

Market overview with current prices and trends.

### SlidebarRight

Trading agents status and management.

### Swap

Token exchange interface with real-time rates.

## API Integration

The application integrates with:

- CoinGecko API for price data
- Vistia API for market data
- CoinMarketCap API for sentiment analysis

## Styling

The application uses Tailwind CSS with a custom dark theme optimized for trading applications. The color scheme includes:

- Primary: `#000000` (black background)
- Secondary: `#3A3A3A` (borders)
- Accent: `#6EFFF8` to `#A571FF` (gradients)
- Success: `#01B792` (green)
- Error: `#FF4349` (red)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
