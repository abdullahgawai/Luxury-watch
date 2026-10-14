declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    DATA_MODE?: string;
    SITE_NAME?: string;
    SITE_ORIGIN?: string;
    EDITOR_USER_IDS?: string;
    THEWATCHAPI_TOKEN?: string;
    THEWATCHAPI_ENABLED?: string;
  }
}
