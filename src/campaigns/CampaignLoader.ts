import type { Campaign, CampaignManifest, CampaignManifestEntry } from './Campaign';

/**
 * Loads campaigns from the public/campaigns directory
 */
export class CampaignLoader {
  private static manifestCache: CampaignManifest | null = null;

  /**
   * Fetch the campaign manifest
   */
  static async getManifest(): Promise<CampaignManifest> {
    if (this.manifestCache) {
      return this.manifestCache;
    }

    const response = await fetch('/campaigns/manifest.json');
    if (!response.ok) {
      throw new Error(`Failed to load campaign manifest: ${response.statusText}`);
    }

    const manifest = await response.json() as CampaignManifest;
    this.manifestCache = manifest;
    return manifest;
  }

  /**
   * Get list of available campaigns from manifest
   */
  static async getAvailableCampaigns(): Promise<CampaignManifestEntry[]> {
    const manifest = await this.getManifest();
    return manifest.campaigns;
  }

  /**
   * Load a specific campaign by ID
   */
  static async loadCampaign(campaignId: string): Promise<Campaign> {
    const manifest = await this.getManifest();
    const entry = manifest.campaigns.find(c => c.id === campaignId);
    
    if (!entry) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    const response = await fetch(`/campaigns/${entry.file}`);
    if (!response.ok) {
      throw new Error(`Failed to load campaign ${campaignId}: ${response.statusText}`);
    }

    const campaign = await response.json() as Campaign;
    
    // Validate campaign has required fields
    if (!campaign.id || !campaign.name || !campaign.encounters) {
      throw new Error(`Invalid campaign structure: ${campaignId}`);
    }

    return campaign;
  }

  /**
   * Clear manifest cache (useful for testing or hot reloading)
   */
  static clearCache(): void {
    this.manifestCache = null;
  }
}

