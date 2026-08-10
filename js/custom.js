/* =====================================================
   奇点博客 · 樱花二次元特效（由 custom.js 注入）
   飘落樱花 / 鼠标星光 / 标签页标题彩蛋 / 控制台问候
   ===================================================== */
(function () {
  'use strict'

  if (!window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('%c[739085] 已检测到“减弱动态效果”偏好，樱花特效自动关闭 🌸', 'color:#ff8fab')
    return
  }

  /* ---------- 1. 飘落的樱花花瓣 ---------- */
  var petalCount = window.innerWidth < 768 ? 12 : 24
  var petalBox = document.createElement('div')
  petalBox.id = 'sakura-layer'
  petalBox.setAttribute('aria-hidden', 'true')
  document.body.appendChild(petalBox)

  for (var i = 0; i < petalCount; i++) {
    ;(function (i) {
      var petal = document.createElement('span')
      petal.className = 'sakura-petal'
      var size = 6 + Math.random() * 9
      var duration = 9 + Math.random() * 9
      var delay = -Math.random() * duration
      var sway = (Math.random() * 90 - 45).toFixed(0)
      petal.style.left = Math.random() * 100 + 'vw'
      petal.style.width = size + 'px'
      petal.style.height = size * 0.75 + 'px'
      petal.style.setProperty('--sway', sway + 'px')
      petal.style.animationDuration = duration + 's'
      petal.style.animationDelay = delay + 's'
      petal.style.opacity = (0.45 + Math.random() * 0.4).toFixed(2)
      petalBox.appendChild(petal)
    })(i)
  }

  /* ---------- 2. 鼠标经过的星光 ---------- */
  var sparkChars = ['✦', '✧', '❀', '✨', '♡']
  var lastSpark = 0
  document.addEventListener('mousemove', function (e) {
    var now = Date.now()
    if (now - lastSpark < 60) return
    lastSpark = now
    var spark = document.createElement('span')
    spark.className = 'cursor-spark'
    spark.textContent = sparkChars[Math.floor(Math.random() * sparkChars.length)]
    spark.style.left = e.clientX + (Math.random() * 14 - 7) + 'px'
    spark.style.top = e.clientY + (Math.random() * 14 - 7) + 'px'
    document.body.appendChild(spark)
    setTimeout(function () { spark.remove() }, 750)
  })

  /* ---------- 3. 离开 / 回到页面时的标题彩蛋 ---------- */
  var originTitle = document.title
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      document.title = '快回来呀～ (>_<)'
    } else {
      document.title = originTitle
    }
  })

  /* ---------- 4. 控制台小彩蛋 ---------- */
  console.log(
    '%c你好呀～欢迎来到 739085 的小窝 ✨',
    'color:#ff8fab;font-size:16px;font-weight:bold;'
  )
  console.log('%c 一起摸鱼，一起折腾，一起变强！', 'color:#ffb3c6;font-size:13px;')
})()