import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

export default function Home() {
  return (
    <Layout
      title="Development Playground"
      description="Minimal Docusaurus site for version diff sign development."
    >
      <header className="hero hero--playground">
        <div className="container">
          <h1 className="hero__title">Version Diff Sign Playground</h1>
          <p className="hero__subtitle playground-summary">
            Use this site to check heading pills, sidebar dots, and TOC dots
            against a minimal versioned-docs fixture before publishing.
          </p>
          <p className="playground-summary">
            Start with <code>/docs/guide/start</code> for automatic diffs and{' '}
            <code>/docs/guide/override</code> for frontmatter overrides.
          </p>
          <div>
            <Link
              className="button button--primary button--lg"
              to="/docs/guide/start"
            >
              Open the docs
            </Link>
          </div>
        </div>
      </header>
    </Layout>
  );
}
