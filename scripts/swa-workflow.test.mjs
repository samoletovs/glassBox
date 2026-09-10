import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(new URL('../.github/workflows/swa-deploy.yml', import.meta.url), 'utf8')
  .replace(/\r\n/g, '\n');
const repository = 'samoletovs/glassBox';

function jobBody(name) {
  const body = workflow.split(new RegExp(`^  ${name}:$`, 'm'))[1]?.split(/^  \w+:$/m)[0];
  if (!body) throw new Error(`Missing workflow job: ${name}`);
  return body;
}

function enabled(name, github) {
  const body = jobBody(name);
  const folded = body.match(/^    if: >-\n((?:      .*\n)+)/m);
  const condition = folded?.[1].trim() ?? body.match(/^    if: (.+)$/m)?.[1];
  if (!condition) throw new Error(`Missing job condition: ${name}`);
  // These job predicates use the GitHub expression subset shared with JavaScript.
  return new Function('github', `return (${condition});`)(github);
}

function pullRequest({ actor = 'samoletovs', author = actor, fork = false, action = 'synchronize' } = {}) {
  return {
    actor,
    repository,
    event_name: 'pull_request',
    event: {
      action,
      pull_request: {
        user: { login: author },
        head: { repo: { full_name: fork ? 'contributor/glassBox' : repository } },
      },
    },
  };
}

describe('SWA workflow event policy', () => {
  it.each(['opened', 'synchronize', 'reopened'])('validates and previews trusted PRs on %s', (action) => {
    const event = pullRequest({ action });
    expect(enabled('quality', event)).toBe(true);
    expect(enabled('deploy', event)).toBe(true);
    expect(enabled('close_pull_request', event)).toBe(false);
  });

  it.each([
    ['Dependabot actor', { actor: 'dependabot[bot]' }],
    ['human update to a Dependabot PR', { actor: 'samoletovs', author: 'dependabot[bot]' }],
    ['Dependabot event on a human PR', { actor: 'dependabot[bot]', author: 'samoletovs' }],
    ['fork PR', { fork: true }],
  ])('builds/tests but never deploys or closes previews for %s', (_label, options) => {
    for (const action of ['opened', 'synchronize', 'reopened', 'closed']) {
      const event = pullRequest({ ...options, action });
      expect(enabled('quality', event)).toBe(action !== 'closed');
      expect(enabled('deploy', event)).toBe(false);
      expect(enabled('close_pull_request', event)).toBe(false);
    }
  });

  it('deploys default-branch pushes without needing a PR payload', () => {
    const event = { actor: 'samoletovs', repository, event_name: 'push', event: {} };
    expect(enabled('quality', event)).toBe(true);
    expect(enabled('deploy', event)).toBe(true);
    expect(enabled('close_pull_request', event)).toBe(false);
  });

  it('only closes the preview for a closed trusted PR', () => {
    const event = pullRequest({ action: 'closed' });
    expect(enabled('quality', event)).toBe(false);
    expect(enabled('deploy', event)).toBe(false);
    expect(enabled('close_pull_request', event)).toBe(true);
    expect(jobBody('close_pull_request')).toContain('action: close');
  });

  it('requires successful quality before deploying and does not hide missing secrets', () => {
    expect(jobBody('deploy')).toMatch(/^    needs: quality$/m);
    expect(jobBody('deploy')).not.toContain('always()');
    expect(jobBody('deploy')).toContain('secrets.AZURE_SWA_TOKEN');
    expect(jobBody('deploy')).toContain('action: upload');
    expect(workflow).not.toMatch(/skip_deploy_on_missing_secrets|continue-on-error|pull_request_target/i);
  });

  it('keeps full build validation in the secret-free quality job', () => {
    const quality = jobBody('quality');
    for (const command of ['npm ci', 'npm run lint', 'npx tsc --noEmit', 'npm run check:byo', 'npm test']) {
      expect(quality).toContain(command);
    }
    expect(quality).toMatch(/name: Build \(frontend\)\n        run: npm run build/);
    expect(quality).toMatch(/cd api\n          npm ci\n          npm run build\n          npm test/);
    expect(quality).not.toMatch(/secrets\.|continue-on-error|if:.*dependabot/);
  });
});
