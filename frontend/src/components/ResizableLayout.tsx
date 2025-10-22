import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

interface ResizableLayoutProps {
  leftPanel: React.ReactNode;
  mainContent: React.ReactNode;
  footer: React.ReactNode;
}

/**
 * ResizableLayout - Main layout wrapper using react-resizable-panels
 * 
 * Layout structure:
 * +------------------------------------------+
 * |  [Left Panel]  |  [Main Content]        |
 * |  (Business)    |  (Transactions)        |
 * |                |                         |
 * +------------------------------------------+
 * |  [Footer - Synchronizer Blocks]         |
 * +------------------------------------------+
 */
export const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  leftPanel,
  mainContent,
  footer
}) => {
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

          <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-blue-400 transition-colors cursor-col-resize" />

          {/* Main Content Area - Transaction Views */}
          <Panel defaultSize={75} minSize={50}>
            <div className="h-full overflow-hidden bg-gray-50">
              {mainContent}
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Footer - Synchronizer Visualization (Timeline) */}
      <div className="h-56 border-t border-gray-300 bg-white shadow-lg">
        {footer}
      </div>
    </div>
  );
};

