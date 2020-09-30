/*
https://covidtracking.com/data/api
Historic values for all states

*/

// very helpful for bar chart: https://observablehq.com/@d3/horizontal-bar-chart
function toDate (d) {
  d = d.toString()
  return new Date(d.slice(0,4), parseInt(d.slice(4,6)) - 1, d.slice(6,8))
}


function choroplethChart (data, metric, date, states) {
  // {state: sum of metric for date}
  let choroplethData = {};
  let minMetricVal = 0;
  let maxMetricVal = 0;

  data.reduce((res, d) => {

    if (!res[d.state]) {
      res[d.state] = {'date': date, 'abbreviation': d.state};
      res[d.state][metric] = 0;
      choroplethData[states[d.state]] = res[d.state];
    }
    if (d.date == date) {
      res[d.state][metric] += d[metric];
      if (d[metric] < minMetricVal) {
        minMetricVal = d[metric];
      }
      if (d[metric] > maxMetricVal) {
        maxMetricVal = d[metric];
      }
    }
    return res
  }, {});

  let margin = {top: 20, right: 30, bottom: 30, left: 60};
  const width = 1000;
  const height = 650;

  console.log(choroplethData);
  color = d3.scaleQuantize([minMetricVal-.25*maxMetricVal, maxMetricVal], d3.schemeBlues[9]);

  path = d3.geoPath();

  const svg = d3.create('svg')
      .attr('viewBox', [0, 0, width, height]);

  svg.append('g')
    .attr('transform', `translate(${height},${margin.top})`);

  svg.append('g')
    .selectAll('path')
    .data(topojson.feature(us, us.objects.states).features)
    .join('path')
      .attr("fill", d => color(choroplethData[d.properties.name][metric]))
      .attr('d', path);

  svg.append('path')
    .datum(topojson.mesh(us, us.objects.states, (a,b) => a !== b))
    .attr('fill', 'none')
    .attr('stroke', 'white')
    .attr('stroke-linejoin', 'round')
    .attr('d', path);

  function displayStateText(d) {
    if (choroplethData[d.properties.name][metric] == maxMetricVal) {
      return maxMetricVal;
    }
  }
  svg.append('g')
    .selectAll('text')
    .data(topojson.feature(us, us.objects.states).features)
    .enter()
    .append('svg:text')
    .text( d => displayStateText(d))
    .attr('x', d => path.centroid(d)[0])
    .attr('y', d => path.centroid(d)[1])
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 14);

  return svg.node()
}




function lineChart (data, metric, date, states) {
  // sum metric per date
  let lineData = []
  data.reduce((res, d) => {
    if (!res[d.date]) {
      res[d.date] = {date: d.date};
      res[d.date][metric] = 0;
      lineData.push(res[d.date])
    }
    if (Object.keys(states).includes(d.state)) {
      res[d.date][metric] += d[metric];
    }
    return res
  }, {});

  data = lineData.map(d => {
    d.properDate = toDate(d.date)
    return d;
  })

  let margin = {top: 20, right: 30, bottom: 30, left: 60};
  const width = 1000;
  const height = 400;

  const svg = d3.create('svg')
      .attr('viewBox', [0, 0, width, height]);

  x = d3.scaleTime()
        .domain(d3.extent(data, d => d.properDate))
        .range([margin.left, width - margin.right])

  y = d3.scaleLinear()
        .domain([d3.max(data, d => d[metric]), d3.min(data, d => d[metric])])
        .range([margin.top, height - margin.bottom])

  let line = d3.line()
      .x(d => x(d.properDate))
      .y(d => y(d[metric]));

  svg.append('path')
    .datum(data)
      .attr('d', line)
      .attr('fill', 'none')
      .attr("stroke", "#000");

  svg.append('g')
      .attr('transform', `translate(0,${height - margin.top})`)
    .call(d3.axisBottom(x));

  svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  return svg.node();
}


function barChart (data, metric, date, states) {
  // this data will change based on the date selection.
  // the input states my be highlighted.
  // future data strucutre:
  // barChartData = {20200925: the data}
  // when user selects data, the data updates:
  // barChartData = {20200924: the data, 20200925: the data}
  // this way if the user selects a previously chosen date, the data is ready
  //
  data = data.filter(d => (d.date == date && Object.keys(states).includes(d.state)));
  data.sort((a, b) => d3.descending(a[metric], b[metric]));

  let margin = {top: 0, right: 0, bottom: 0, left: 30};
  let width = 200;
  const barHeight = 25;
  let height = Math.ceil((data.length + 0.1) * barHeight) + margin.top + margin.bottom;

  x = d3.scaleLinear()
      .domain([d3.min(data, d => d[metric]), d3.max(data, d => d[metric])])
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
let us;
let states = {
  AK: 'Alaska',
  AL: 'Alabama',
  AR: 'Arkansas',
  AS: 'American Samoa',
  AZ: 'Arizona',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DC: 'District of Columbia',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  GU: 'Guam',
  HI: 'Hawaii',
  IA: 'Iowa',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  MA: 'Massachusetts',
  MD: 'Maryland',
  ME: 'Maine',
  MI: 'Michigan',
  MN: 'Minnesota',
  MO: 'Missouri',
  MP: 'Northern Mariana Islands',
  MS: 'Mississippi',
  MT: 'Montana',
  NC: 'North Carolina',
  ND: 'North Dakota',
  NE: 'Nebraska',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NV: 'Nevada',
  NY: 'New York',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  PR: 'Puerto Rico',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VA: 'Virginia',
  VI: 'U.S. Virgin Islands',
  VT: 'Vermont',
  WA: 'Washington',
  WI: 'Wisconsin',
  WV: 'West Virginia',
  WY: 'Wyoming',
}

d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json')
  .then(data => us = data);

d3.json('https://api.covidtracking.com/api/v1/states/daily.json')
  .then(data => {
    today = data[0].date;
    return data;
  })
  .then(data => {
      const barChartDiv = document.getElementById('bar-chart');
      barChartDiv.append(barChart(data, metric, today, states));

      const lineChartDiv = document.getElementById('line-chart');
      lineChartDiv.append(lineChart(data, metric, today, states));

      const choroplethChartDiv = document.getElementById('choropleth-chart');
      choroplethChartDiv.append(choroplethChart(data, metric, today, states));
    });
