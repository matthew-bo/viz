import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { MobileLayout } from './MobileLayout';

interface ResizableLayoutProps {
  leftPanel: React.ReactNode;
  mainContent: React.ReactNode;
  footer: React.ReactNode;
}

/**
 * ResizableLayout - Adaptive layout wrapper
 * 
 * Desktop (≥1024px):
 * +------------------------------------------+
 * |  [Left Panel]  |  [Main Content]        |
 * |  (Business)    |  (Transactions)        |
 * |                |                         |
 * +------------------------------------------+
 * |  [Footer - Synchronizer Blocks]         |
 * +------------------------------------------+
 * 
 * Mobile (<1024px):
 * ┌─────────────────────────────────┐
 * │      Content (full screen)      │
 * │      Based on active tab        │
 * │                                 │
 * ├─────────────────────────────────┤
 * │  [📊] [💼] [⏱️] [📈]  ← Tabs   │
 * └─────────────────────────────────┘
 */
export const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  leftPanel,
  mainContent,
  footer
}) => {
  const isDesktop = useIsDesktop();

  // Mobile layout - Use bottom navigation with tab switching
  if (!isDesktop) {
    return (
      <MobileLayout
        leftPanel={leftPanel}
        mainContent={mainContent}
        footer={footer}
      />
    );
  }

  // Desktop layout - Use resizable panels (original behavior)
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Main horizontal split: Left panel + Main content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Panel - Business/Party Cards */}
          <Panel
            defaultSize={25}
            minSize={20}
            maxSize={35}
            className="bg-white border-r border-gray-200"
          >
            <div className="h-full overflow-y-auto">
              {leftPanel}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-gray-300 hover:bg-blue-500 transition-colors cursor-col-resize relative group">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-8 bg-blue-600 rounded-full shadow-md" />
          </div>
        </PanelResizeHandle>

          {/* Main Content Area - Transaction Views */}
          <Panel defaultSize={75} minSize={50}>
            <div className="h-full overflow-hidden bg-gray-50">
              {mainContent}
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Footer - Synchronizer Visualization (Timeline) */}
      <div className="h-60 border-t border-gray-300 bg-white shadow-lg">
        {footer}
      </div>
    </div>
  );
};

