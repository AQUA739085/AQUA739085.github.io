/* 首頁 link-in-bio 風格：只保留乾淨的連結列表 */
(function () {
  'use strict'

  function initLinkPage() {
    if (!document.getElementById('recent-posts')) return
    document.body.classList.add('home-linkpage')

    var siteInfo = document.getElementById('site-info')
    if (!siteInfo || siteInfo.querySelector('.linkpage-avatar')) return

    var source =
      document.querySelector('#aside-content .avatar-img img') ||
      document.querySelector('#blog-info .site-icon')
    if (!source) return

    var avatar = document.createElement('img')
    avatar.className = 'linkpage-avatar'
    avatar.src = source.src
    avatar.alt = document.title || ''
    avatar.loading = 'lazy'
    siteInfo.insertBefore(avatar, siteInfo.firstChild)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLinkPage)
  } else {
    initLinkPage()
  }
})()
