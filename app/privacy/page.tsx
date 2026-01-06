export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-16 px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: January 6, 2026
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6">
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">What Data We Collect</h2>
            <p className="text-muted-foreground">
              When you use ATProto Heatmap to visualize your activity, we collect and store the following information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Your Bluesky handle (e.g., @username.bsky.social)</li>
              <li>Your Decentralized Identifier (DID)</li>
              <li>Your public profile information (display name, avatar, bio)</li>
              <li>Your public post records including:
                <ul className="list-circle list-inside ml-6 mt-1">
                  <li>Record URIs</li>
                  <li>Timestamps</li>
                  <li>Collection types (posts, replies, likes, reposts, etc.)</li>
                </ul>
              </li>
              <li>Aggregated activity counts</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">How We Use Your Data</h2>
            <p className="text-muted-foreground">
              Your data is used solely to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Generate your activity heatmap visualization</li>
              <li>Display collection breakdowns and statistics</li>
              <li>Cache data to improve performance and reduce API calls</li>
              <li>Generate Open Graph preview images for social sharing</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Data Source</h2>
            <p className="text-muted-foreground">
              All data collected is already publicly available via the AT Protocol (ATProto) network. We do not access any private or non-public information. The data is retrieved using standard ATProto APIs that any application can use to access public posts and profiles.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Data Retention</h2>
            <p className="text-muted-foreground">
              Your data is stored indefinitely to provide fast access to your heatmap. However, you have the right to request deletion of your data at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Your Rights</h2>
            <p className="text-muted-foreground">
              Under GDPR, CCPA, and similar privacy regulations, you have the following rights:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Right to know:</strong> You can see what data we've collected about you</li>
              <li><strong>Right to deletion:</strong> You can request deletion of your cached data</li>
              <li><strong>Right to opt-out:</strong> You can choose not to use this service</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">How to Delete Your Data</h2>
            <p className="text-muted-foreground">
              To delete your cached data from our system:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
              <li>Visit your profile page on ATProto Heatmap</li>
              <li>Click the menu button (three dots) in the profile header</li>
              <li>Select "Reset Data" or "Delete My Data"</li>
              <li>Confirm the deletion</li>
            </ol>
            <p className="text-muted-foreground mt-4">
              This will permanently remove all cached data associated with your handle from our database.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Data Security</h2>
            <p className="text-muted-foreground">
              We use industry-standard security practices to protect your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Data is stored in secure, encrypted databases (Supabase/PostgreSQL)</li>
              <li>All connections use HTTPS encryption</li>
              <li>Access to data is restricted and logged</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Third-Party Services</h2>
            <p className="text-muted-foreground">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Supabase:</strong> For database hosting and storage</li>
              <li><strong>Netlify:</strong> For hosting and serverless functions</li>
              <li><strong>AT Protocol Network:</strong> For fetching public data</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              These services have their own privacy policies which govern how they handle data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Analytics</h2>
            <p className="text-muted-foreground">
              We do not use any analytics or tracking services. We do not collect any information about your browsing behavior beyond what's necessary to provide the heatmap service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this privacy policy from time to time. We will notify users of any material changes by updating the "Last updated" date at the top of this page.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Contact</h2>
            <p className="text-muted-foreground">
              If you have any questions about this privacy policy or wish to exercise your rights, please contact us through the GitHub repository for this project.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-border/50">
          <a
            href="/"
            className="text-primary hover:underline inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
