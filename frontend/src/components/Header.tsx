import { memo } from 'react';
import { Wifi, WifiOff, Hexagon } from 'lucide-react';

interface Props {
  isConnected: boolean;
}

/**
 * Header - App header with branding and connection status
 */
function Header({ isConnected }: Props) {
  return (
    <header className="bg-gradient-to-r from-canton-dark via-canton-dark-light to-canton-dark text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="bg-canton-blue p-2 rounded-lg">
              <Hexagon className="w-6 h-6" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Canton Privacy Blockchain
              </h1>
              <p className="text-sm text-gray-300">
                Multi-Party Privacy-Preserving Transactions
              </p>
            </div>
          </div>

          {/* Connection Status */}
          <div 
            className="flex items-center gap-2"
            role="status"
            aria-live="polite"
            aria-label={isConnected ? 'Connected to Canton Network' : 'Connecting to Canton Network'}
          >
            {isConnected ? (
              <>
                <div className="relative">
                  <Wifi className="w-5 h-5 text-green-400" aria-hidden="true" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true"></span>
                </div>
                <span className="text-sm font-medium text-green-400">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-gray-400 animate-pulse" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-400">Connecting...</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default memo(Header);

