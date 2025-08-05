import { useState, useEffect } from 'react';
import { DebugData, DebugPanelProps } from './types';

const DebugPanel: React.FC<DebugPanelProps> = ({ component, page_props, router }) => {
  const [is_expanded, set_is_expanded] = useState(false);
  const [debug_data, set_debug_data] = useState<DebugData | null>(null);

  useEffect(() => {
    const collect_debug_data = (): DebugData => {
      const data: DebugData = {
        page_info: {
          component_name: component.displayName || component.name || 'Unknown',
          pathname: router.pathname,
          query: router.query,
          as_path: router.asPath,
        },
        server_data: {
          page_props: page_props,
          session: page_props.session,
          team_features: page_props.teamFeatures,
        },
        performance: {},
        environment: {
          node_env: process.env.NODE_ENV || 'unknown',
        },
      };

      if (typeof window !== 'undefined') {
        // Performance data
        const nav_timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (nav_timing) {
          data.performance.navigation_timing = {
            page_load_time: Math.round(nav_timing.loadEventEnd - nav_timing.fetchStart),
            dom_content_loaded: Math.round(nav_timing.domContentLoadedEventEnd - nav_timing.fetchStart),
            first_paint: Math.round(nav_timing.responseEnd - nav_timing.fetchStart),
            dns_lookup: Math.round(nav_timing.domainLookupEnd - nav_timing.domainLookupStart),
            tcp_connect: Math.round(nav_timing.connectEnd - nav_timing.connectStart),
          };
        }

        // Memory info (Chrome only)
        if ('memory' in performance) {
          data.performance.memory = {
            used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024),
          };
        }

        // Browser & device info
        data.environment = {
          ...data.environment,
          browser: navigator.userAgent.split(' ').pop() || 'Unknown',
          language: navigator.language,
          online: navigator.onLine,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          screen: `${screen.width}x${screen.height}`,
          color_scheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
          reduced_motion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          document_state: document.readyState,
          has_focus: document.hasFocus(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        // Storage info
        try {
          data.environment.local_storage_keys = Object.keys(localStorage).length;
          data.environment.session_storage_keys = Object.keys(sessionStorage).length;
        } catch (e) {
          data.environment.storage_access = 'blocked';
        }
      }

      return data;
    };

    set_debug_data(collect_debug_data());
  }, [component, page_props, router]);


  const render_data_elegantly = (data: any, key_path: string = '') => {
    if (data === null) return <span style={{ color: '#9ca3af' }}>null</span>;
    if (data === undefined) return <span style={{ color: '#9ca3af' }}>undefined</span>;
    
    const data_type = typeof data;
    
    if (data_type === 'string') {
      return <span style={{ color: '#34d399' }}>"{data}"</span>;
    }
    
    if (data_type === 'number') {
      return <span style={{ color: '#60a5fa' }}>{data}</span>;
    }
    
    if (data_type === 'boolean') {
      return <span style={{ color: '#f87171' }}>{data.toString()}</span>;
    }
    
    if (Array.isArray(data)) {
      if (data.length === 0) return <span style={{ color: '#9ca3af' }}>[]</span>;
      if (data.length > 10) {
        return (
          <div>
            <span style={{ color: '#9ca3af' }}>[Array({data.length})] </span>
            <button 
              onClick={() => console.log(`${key_path}:`, data)}
              style={{ 
                color: '#fbbf24', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '11px'
              }}
            >
              View in Console
            </button>
          </div>
        );
      }
      return (
        <div style={{ marginLeft: '16px' }}>
          {data.map((item, index) => (
            <div key={index} style={{ marginBottom: '4px' }}>
              <span style={{ color: '#9ca3af' }}>[{index}]:</span> {render_data_elegantly(item, `${key_path}[${index}]`)}
            </div>
          ))}
        </div>
      );
    }
    
    if (data_type === 'object') {
      const keys = Object.keys(data);
      if (keys.length === 0) return <span style={{ color: '#9ca3af' }}>{'{}'}</span>;
      if (keys.length > 15) {
        return (
          <div>
            <span style={{ color: '#9ca3af' }}>{`{Object with ${keys.length} keys}`} </span>
            <button 
              onClick={() => console.log(`${key_path}:`, data)}
              style={{ 
                color: '#fbbf24', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '11px'
              }}
            >
              View in Console
            </button>
          </div>
        );
      }
      return (
        <div style={{ marginLeft: '16px' }}>
          {keys.map(key => (
            <div key={key} style={{ marginBottom: '4px' }}>
              <span style={{ color: '#a78bfa' }}>{key}:</span> {render_data_elegantly(data[key], `${key_path}.${key}`)}
            </div>
          ))}
        </div>
      );
    }
    
    return <span style={{ color: '#f3f4f6' }}>{String(data)}</span>;
  };

  if (!debug_data) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      zIndex: 9999,
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      {!is_expanded ? (
        <button
          onClick={() => set_is_expanded(true)}
          style={{
            backgroundColor: '#2d3748',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
          title="Open Debug Panel"
        >
          🔧
        </button>
      ) : (
        <div style={{
          backgroundColor: '#1a202c',
          color: '#e2e8f0',
          border: '1px solid #4a5568',
          borderRadius: '8px',
          width: '100vw',
          height: '40vh',
          position: 'fixed',
          bottom: '0',
          right: '0',
          left: '0',
          overflow: 'hidden',
          boxShadow: '0 -4px 25px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '12px',
            borderBottom: '1px solid #4a5568',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#2d3748'
          }}>
            <span style={{ fontWeight: 'bold' }}>Debug Panel</span>
            <button
              onClick={() => set_is_expanded(false)}
              style={{
                backgroundColor: 'transparent',
                color: '#e2e8f0',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ 
            flex: '1', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'row',
            gap: '1px'
          }}>
            {[
              { key: 'page_info', label: '📄 Page Info', data: debug_data.page_info },
              { key: 'server_data', label: '🗄️ Server Data', data: debug_data.server_data },
              { key: 'performance', label: '⚡ Performance', data: debug_data.performance },
              { key: 'environment', label: '🌐 Environment', data: debug_data.environment }
            ].map(section => (
              <div key={section.key} style={{ 
                flex: '1',
                backgroundColor: '#2d3748',
                display: 'flex',
                flexDirection: 'column',
                minWidth: '200px'
              }}>
                <div style={{
                  backgroundColor: '#4a5568',
                  color: '#e2e8f0',
                  padding: '8px 12px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  borderBottom: '1px solid #1a202c'
                }}>
                  {section.label}
                </div>
                <div style={{
                  padding: '12px',
                  overflow: 'auto',
                  flex: '1',
                  fontSize: '12px',
                  lineHeight: '1.4'
                }}>
                  {render_data_elegantly(section.data, section.key)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;