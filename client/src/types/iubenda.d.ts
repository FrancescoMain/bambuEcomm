// Global type declarations for iubenda
declare global {
  interface Window {
    _iub?:
      | {
          cs?: {
            api?: {
              openPreferenceCenter: () => void;
            };
          };
          csConfiguration?: {
            siteId: number;
            cookiePolicyId: number;
            lang: string;
            storage: {
              useSiteId: boolean;
            };
          };
        }
      | any[];
  }
}

export {};
