export const config = {
  github: {
    token: process.env.GITHUB_TOKEN || '',
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || ''
  },
  cache: {
    duration: 3600000 
  },
  server: {
    port: process.env.PORT || 3000
  }
}

if (!config.github.token || !config.github.owner || !config.github.repo) {
  console.error('Missing required environment variables: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO')
  process.exit(1)
}