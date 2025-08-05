export interface DebugData {
  page_info: {
    component_name: string;
    pathname: string;
    query: Record<string, string | string[]>;
    as_path: string;
  };
  server_data: {
    page_props: Record<string, any>;
    session?: any;
    team_features?: Record<string, boolean>;
  };
  performance: {
    navigation_timing?: PerformanceNavigationTiming;
    resource_entries?: PerformanceResourceTiming[];
    page_load_time?: number;
  };
  environment: {
    node_env: string;
    app_url?: string;
    features?: Record<string, any>;
  };
}

export interface DebugPanelProps {
  component: React.ComponentType<any>;
  page_props: Record<string, any>;
  router: {
    pathname: string;
    query: Record<string, string | string[]>;
    asPath: string;
  };
}