var ghpages = require('gh-pages');

ghpages.publish(
  'public',
  {
    branch: 'gh-pages',
    repo: 'https://github.com/dan-menard/quotebreaker.git',
    user: {
      name: 'Dan Menard',
      email: 'daniel.menard@gmail.com'
    }
  }
)
