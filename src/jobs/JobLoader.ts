import type { Job, JobManifest, JobManifestEntry } from './Job';

/**
 * Loads jobs from the public/jobs directory
 */
export class JobLoader {
  private static manifestCache: JobManifest | null = null;

  /**
   * Fetch the job manifest
   */
  static async getManifest(): Promise<JobManifest> {
    if (this.manifestCache) {
      return this.manifestCache;
    }

    const response = await fetch('/jobs/manifest.json');
    if (!response.ok) {
      throw new Error(`Failed to load job manifest: ${response.statusText}`);
    }

    const manifest = await response.json() as JobManifest;
    this.manifestCache = manifest;
    return manifest;
  }

  /**
   * Get list of available jobs from manifest
   */
  static async getAvailableJobs(): Promise<JobManifestEntry[]> {
    const manifest = await this.getManifest();
    return manifest.jobs;
  }

  /**
   * Load a specific job by ID
   */
  static async loadJob(jobId: string): Promise<Job> {
    const manifest = await this.getManifest();
    const entry = manifest.jobs.find(j => j.id === jobId);
    
    if (!entry) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const response = await fetch(`/jobs/${entry.file}`);
    if (!response.ok) {
      throw new Error(`Failed to load job ${jobId}: ${response.statusText}`);
    }

    const job = await response.json() as Job;
    
    // Validate job has required fields
    if (!job.id || !job.name || !job.scenarios) {
      throw new Error(`Invalid job structure: ${jobId}`);
    }

    return job;
  }

  /**
   * Clear manifest cache (useful for testing or hot reloading)
   */
  static clearCache(): void {
    this.manifestCache = null;
  }
}

