/*
https://covidtracking.com/data/api
Historic values for all states

*/

// very helpful for bar chart: https://observablehq.com/@d3/horizontal-bar-chart

function barChart (data, metric, date, states) {
  data = data.filter(d => (d.date == date && states.includes(d.state)));
  data.sort((a, b) => d3.descending(a[metric], b[metric]));

  let margin = {top: 0, right: 0, bottom: 0, left: 30};
  let width = 200;
  const barHeight = 25;
  let height = Math.ceil((data.length + 0.1) * barHeight) + margin.top + margin.bottom;

  x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[metric])])
      .range([margin.left, width - margin.right])

  y = d3.scaleBand()
      .domain(d3.range(data.length))
      .rangeRound([margin.top, height - margin.bottom])
      .padding(0.1)

  yAxis = g => g
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickFormat(i => data[i].state).tickSize(0))

  format = x.tickFormat(20, data.format)

  const svg = d3.create('svg')
      .attr('viewBox', [0, 0, width, height]);

  svg.append('g')
      .attr('fill', 'steelblue')
    .selectAll('rect')
    .data(data)
    .join('rect')
      .attr('x', x(0))
      .attr('y', (d, i) => y(i))
      .attr('width', d => x(d[metric]) - x(0))
      .attr('height', y.bandwidth());

  svg.append('g')
      .attr('fill', 'white')
      .attr('text-anchor', 'end')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 11)
    .selectAll('text')
    .data(data)
    .join('text')
      .attr('x', d => x(d[metric]))
      .attr('y', (d, i) => y(i) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('dx', -4)
      .text(d => format(d[metric]))
    .call(text => text.filter(d => x(d[metric]) - x(0) < 30) // short bars
      .attr('dx', +4)
      .attr('fill', 'black')
      .attr('text-anchor', 'start'));

  svg.append('g')
      .call(yAxis)
      .call(g => g.select('.domain').remove());

  return svg.node();

}

let metrics = ['positiveIncrease', 'deathIncrease']
let metric = metrics[0];
let today;
let states;

d3.json('https://api.covidtracking.com/api/v1/states/daily.json')
  .then(data => {
    today = data[0].date;
    states = [...new Set(data.map(item => item.state))];
    return data;
  })
  .then(data => {
      const barChartDiv = document.getElementById('bar-chart');
      barChartDiv.append(barChart(data, metric, today, states));
    });
