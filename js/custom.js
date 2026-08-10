/* =====================================================
   奇点博客 · 夜色樱花 二次元特效 v2
   星空 / 樱花 / 星光鼠标 / 看板娘 / 和风装饰 / 小彩蛋
   ===================================================== */
(function () {
  'use strict'

  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* ---------- 1. 星空（暗色模式可见） ---------- */
  function initStars() {
    var bg = document.getElementById('web_bg')
    if (!bg || reduceMotion) return

    var canvas = document.createElement('canvas')
    canvas.id = 'starfield'
    bg.appendChild(canvas)
    var ctx = canvas.getContext('2d')
    var stars = []

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)

    var count = Math.min(150, Math.floor((window.innerWidth * window.innerHeight) / 8000))
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.7 + 0.3,
        s: Math.random() * 0.02 + 0.005,
        p: Math.random() * Math.PI * 2
      })
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (var j = 0; j < stars.length; j++) {
        var st = stars[j]
        st.p += st.s
        var alpha = st.a * (0.55 + 0.45 * Math.sin(st.p))
        ctx.beginPath()
        ctx.arc(st.x * canvas.width, st.y * canvas.height, st.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 220, 245, ' + alpha.toFixed(3) + ')'
        ctx.fill()
      }
      requestAnimationFrame(draw)
    }

    draw()
  }

  /* ---------- 2. 飘落的樱花花瓣 ---------- */
  function initSakura() {
    if (reduceMotion) return

    var count = window.innerWidth < 768 ? 12 : 22
    var layer = document.createElement('div')
    layer.id = 'sakura-layer'
    layer.setAttribute('aria-hidden', 'true')
    document.body.appendChild(layer)

    for (var i = 0; i < count; i++) {
      ;(function (i) {
        var petal = document.createElement('span')
        petal.className = 'sakura-petal'
        var size = 7 + Math.random() * 9
        var duration = 9 + Math.random() * 9
        var delay = -Math.random() * duration
        var sway = (Math.random() * 90 - 45).toFixed(0)
        petal.style.left = Math.random() * 100 + 'vw'
        petal.style.width = size + 'px'
        petal.style.height = size * 0.8 + 'px'
        petal.style.borderRadius = Math.random() > 0.5 ? '150% 0 150% 0' : '0 150% 0 150%'
        petal.style.setProperty('--sway', sway + 'px')
        petal.style.animationDuration = duration + 's'
        petal.style.animationDelay = delay + 's'
        petal.style.opacity = (0.45 + Math.random() * 0.4).toFixed(2)
        layer.appendChild(petal)
      })(i)
    }
  }

  /* ---------- 3. 鼠标经过的星光 ---------- */
  var sparkChars = ['✦', '✧', '❀', '✨', '♡']
  var lastSpark = 0
  document.addEventListener('mousemove', function (e) {
    if (reduceMotion) return
    var now = Date.now()
    if (now - lastSpark < 60) return
    lastSpark = now
    var spark = document.createElement('span')
    spark.className = 'cursor-spark'
    spark.textContent = sparkChars[Math.floor(Math.random() * sparkChars.length)]
    spark.style.left = e.clientX + (Math.random() * 14 - 7) + 'px'
    spark.style.top = e.clientY + (Math.random() * 14 - 7) + 'px'
    document.body.appendChild(spark)
    setTimeout(function () {
      spark.remove()
    }, 750)
  })

  /* ---------- 4. 看板娘小吉祥物 ---------- */
  function initMascot() {
    if (document.getElementById('mascot')) return

    var box = document.createElement('div')
    box.id = 'mascot'
    var face = document.createElement('img')
    face.id = 'mascot-face'
    face.src = '/images/mascot.webp'
    face.alt = '看板娘'
    face.draggable = false
    face.setAttribute('role', 'button')
    face.setAttribute('aria-label', '看板娘小助手')
    face.setAttribute('title', '戳我一下～')
    var bubble = document.createElement('div')
    bubble.id = 'mascot-bubble'
    box.appendChild(face)
    box.appendChild(bubble)
    document.body.appendChild(box)

    var lines = [
      '欢迎回家～主人 ✨',
      '今天也要加油鸭！',
      '代码写累了就歇会儿吧～',
      '樱花都替你开了，快更新博客！',
      '喵～今天想听什么故事？',
      '悄悄告诉你：我是这个家的看板娘 (◕‿◕)'
    ]
    var timer = null

    face.addEventListener('click', function () {
      if (timer) clearTimeout(timer)
      bubble.textContent = lines[Math.floor(Math.random() * lines.length)]
      bubble.classList.add('show')
      timer = setTimeout(function () {
        bubble.classList.remove('show')
      }, 3200)
    })
  }

  /* ---------- 5. 首屏和风装饰 ---------- */
  function initHeroDeco() {
    var siteInfo = document.getElementById('site-info')
    if (!siteInfo || siteInfo.querySelector('.hero-deco')) return

    var decos = [
      { cls: 'hero-deco hero-deco-l', text: '桜' },
      { cls: 'hero-deco hero-deco-r', text: '❀' },
      { cls: 'hero-deco hero-deco-tl', text: '✦' },
      { cls: 'hero-deco hero-deco-tr', text: '✧' }
    ]
    decos.forEach(function (d) {
      var span = document.createElement('span')
      span.className = d.cls
      span.textContent = d.text
      span.setAttribute('aria-hidden', 'true')
      siteInfo.appendChild(span)
    })
  }

  /* ---------- 5.5 封面随机：每次刷新换一张 ---------- */
  var coverPool = [
  '/images/cover-sunset.webp',
  '/images/cover-dusk.webp',
  '/images/cover-night.webp',
  '/images/cover-sky.webp',
  '/images/cover-mist.webp',
  '/images/hero-sakura.webp',
  '/images/hero-city.webp',
  '/images/cover-rose.webp',
  '/images/cover-sand.webp',
  '/images/cover-amber.webp',
  '/images/cover-indigo.webp'
  ]

  function initCoverRandom() {
    var imgs = document.querySelectorAll(
      '.post_cover img, .thumbnail img, .article-sort-item-img img'
    )
    imgs.forEach(function (img) {
      img.src = coverPool[Math.floor(Math.random() * coverPool.length)]
    })
  }

  /* ---------- 6. 离开 / 回到页面时的标题彩蛋 ---------- */
  var originTitle = document.title
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      document.title = '快回来呀～ (>_<)'
    } else {
      document.title = originTitle
    }
  })

  /* ---------- 7. 控制台小彩蛋 ---------- */
  console.log(
    '%c你好呀～欢迎来到 739085 的小窝 ✨',
    'color:#ff8fab;font-size:16px;font-weight:bold;'
  )
  console.log('%c 樱花树下，一起摸鱼、折腾、变强！', 'color:#ffb3c6;font-size:13px;')

  /* ---------- 启动 ---------- */
  initStars()
  initSakura()
  initMascot()
  initHeroDeco()
  initCoverRandom()
})()
