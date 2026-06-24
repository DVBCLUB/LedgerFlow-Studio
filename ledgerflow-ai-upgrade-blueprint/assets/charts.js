(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  var maturityEl = document.getElementById('chart-connector-maturity');
  if (!maturityEl || typeof echarts === 'undefined') return;

  var maturityChart = echarts.init(maturityEl, null, { renderer: 'svg' });
  maturityChart.setOption({
    animation: false,
    color: [accent, accent2, muted, accent + '99'],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      appendToBody: true,
      backgroundColor: bg2,
      borderColor: rule,
      textStyle: { color: ink }
    },
    grid: { top: 24, right: 20, bottom: 40, left: 56 },
    xAxis: {
      type: 'category',
      data: ['Connected', 'Local-first', 'Manual', 'Planned'],
      axisLabel: { color: muted },
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: muted },
      splitLine: { lineStyle: { color: rule, opacity: 0.65 } },
      axisLine: { show: false }
    },
    series: [{
      type: 'bar',
      data: [
        { value: 1, itemStyle: { color: accent } },
        { value: 7, itemStyle: { color: accent2 } },
        { value: 9, itemStyle: { color: muted } },
        { value: 2, itemStyle: { color: accent + '99' } }
      ],
      barWidth: '48%',
      label: {
        show: true,
        position: 'top',
        color: ink,
        fontWeight: 700
      }
    }]
  });

  window.addEventListener('resize', function () {
    maturityChart.resize();
  });
})();
