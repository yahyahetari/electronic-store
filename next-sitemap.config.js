module.exports = {
    siteUrl: 'https://hetari.shop',
    generateRobotsTxt: true,
    priority: 1.0,
    changefreq: 'daily',
    exclude: ['/api/*'],
    robotsTxtOptions: {
      additionalSitemaps: [
        'https://hetari.shop/sitemap.xml',
      ],
    },
  }
  