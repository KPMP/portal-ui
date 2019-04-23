// @flow

// Vender
import React from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import {
  compose,
  withState,
  pure,
  withProps,
  withPropsOnChange,
} from 'recompose';
import _ from 'lodash';
import * as ss from 'simple-statistics';
import './qq.css';

// Custom
import { withTheme } from '@ncigdc/theme';
import { withTooltip } from '@ncigdc/uikit/Tooltip';
import withSize from '@ncigdc/utils/withSize';
import '@ncigdc/components/Charts/style.css';

const sortAscending = (a, b) => {
  return a - b;
};

// from https://rangevoting.org/Qnorm.html
const qnorm = function(p) {
  // ALGORITHM AS 111, APPL.STATIST., VOL.26, 118-121, 1977.
  // Computes z = invNorm(p)

  p = parseFloat(p);
  const split = 0.42;

  const a0 = 2.50662823884;
  const a1 = -18.61500062529;
  const a2 = 41.39119773534;
  const a3 = -25.44106049637;
  const b1 = -8.4735109309;
  const b2 = 23.08336743743;
  const b3 = -21.06224101826;
  const b4 = 3.13082909833;
  const c0 = -2.78718931138;
  const c1 = -2.29796479134;
  const c2 = 4.85014127135;
  const c3 = 2.32121276858;
  const d1 = 3.54388924762;
  const d2 = 1.63706781897;

  let q = p - 0.5;

  let r;
  let ppnd;

  if (Math.abs(q) <= split) {
    r = q * q;
    ppnd =
      (q * (((a3 * r + a2) * r + a1) * r + a0)) /
      ((((b4 * r + b3) * r + b2) * r + b1) * r + 1);
  } else {
    r = p;
    if (q > 0) r = 1 - p;
    if (r > 0) {
      r = Math.sqrt(-Math.log(r));
      ppnd = (((c3 * r + c2) * r + c1) * r + c0) / ((d2 * r + d1) * r + 1);
      if (q < 0) ppnd = -ppnd;
    } else {
      ppnd = 0;
    }
  }

  return ppnd;
};

const QQPlot = ({
  data = [],
  title,
  // yAxis = {},
  // xAxis = {},
  styles,
  height: h = 400,
  margin: m,
  setTooltip,
  theme,
  size: { width },
}) => {
  const testValues = data.filter(d => _.isNumber(d)).sort(sortAscending);
  const n = testValues.length;

  const mean = testValues.reduce((acc, i) => acc + i, 0) / n;
  const deviations = testValues.map(v => v - mean);
  const squaredDeviations = deviations
    .map(d => d * d)
    .reduce((acc, d) => acc + d, 0);

  const variance = squaredDeviations / n;

  const standardDeviation = Math.sqrt(variance);

  const getZScore = (age, m, stdDev) => (age - m) / stdDev;

  // i think this is giving you the qq line
  const qqLine = testValues.map((age, i) => [
    getZScore(age, mean, standardDeviation),
    age,
  ]);

  const zScores = testValues.map((age, i) => [qnorm((i + 1 - 0.5) / n), age]);
  // console.log(zScores);
  const objZScores = zScores.map(score => ({ x: score[0], y: score[1] }));

  // const fooScores = testValues.map(age => ({
  //   x: getZScore(age, mean, standardDeviation),
  //   y: age,
  // }));
  const el = ReactFauxDOM.createElement('div');
  el.style.width = '100%';

  el.setAttribute('class', 'test-qq-plot');
  const innerPadding = 0.3;
  const outerPadding = 0.3;

  const margin = m || { top: 20, right: 50, bottom: 65, left: 55 };
  const chartWidth = width - margin.left - margin.right;
  const height = (h || 200) - margin.top - margin.bottom;
  //
  // const firstQuartile = Math.ceil(data.length * (1 / 4));
  // const thirdQuartile = Math.ceil(data.length * (3 / 4));

  const w = 600;
  // const h = 400;
  const padding = 40;
  const xScale = d3
    .scaleLinear()
    .domain([
      d3.min(zScores, function(d) {
        return Math.floor(d[0]);
      }),
      d3.max(zScores, function(d) {
        return Math.ceil(d[0]);
      }),
    ])
    .range([padding, w - padding * 2]);

  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(zScores, function(d) {
        return d[1];
      }),
    ])
    //.range([padding, w-padding * 2]);
    .range([h - padding, padding]);

  const xAxis = d3
    .axisBottom()
    .scale(xScale)
    .ticks(4);

  const yAxis = d3
    .axisLeft()
    .scale(yScale)
    .ticks(5);

  const yAxisStyle = yAxis.style || {
    textFill: theme.greyScale3,
    fontSize: '1.3rem',
    fontWeight: '500',
    stroke: theme.greyScale4,
  };
  const xAxisStyle = xAxis.style || {
    textFill: theme.greyScale3,
    fontSize: '1.3rem',
    fontWeight: '700',
    stroke: theme.greyScale4,
  };

  //create svg element
  const svg = d3
    .select(el)
    .append('svg')
    .attr('width', w)
    .attr('height', h);

  svg
    .append('text')
    .attr('y', 0)
    .attr('x', width / 4)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('fontSize', '2rem')
    .style('fontWeight', '500')
    .style('marginBottom', 10)
    // .attr('fill', yAxisStyle.textFill)
    .text(title);
  svg
    .selectAll('circle')
    .data(zScores)
    .enter()
    .append('circle')
    .attr('cx', function(d) {
      return xScale(d[0]);
    })
    .attr('cy', function(d) {
      return yScale(d[1]);
    })
    .attr('r', 5)
    .attr('stroke', 'green')
    .attr('fill', 'white');

  svg
    .append('defs')
    .append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', width)
    .attr('height', height + 55); // calculate from height instead of hardcoded

  function LeastSquares(values_x, values_y) {
    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_xx = 0;
    var count = 0;

    /*
     * We'll use those variables for faster read/write access.
     */
    var x = 0;
    var y = 0;
    var values_length = values_x.length;

    if (values_length !== values_y.length) {
      throw new Error(
        'The parameters values_x and values_y need to have same size!'
      );
    }

    /*
     * Nothing to do.
     */
    if (values_length === 0) {
      return [[], []];
    }

    /*
     * Calculate the sum for each of the parts necessary.
     */
    for (var v = 0; v < values_length; v++) {
      x = values_x[v];
      y = values_y[v];
      sum_x += x;
      sum_y += y;
      sum_xx += x * x;
      sum_xy += x * y;
      count++;
    }

    /*
     * Calculate m and b for the formular:
     * y = x * m + b
     */
    var m = (count * sum_xy - sum_x * sum_y) / (count * sum_xx - sum_x * sum_x);
    var b = sum_y / count - (m * sum_x) / count;

    return { b: b, m: m };
  }

  // var drawline = function(data) {
  //   console.log('hiiiii');
  //   var xValues = data.map(function(d) {
  //     return xScale(d.x);
  //   });
  //   var yValues = data.map(function(d) {
  //     return yScale(d.y);
  //   });
  //   var lsCoef = [LeastSquares(xValues, yValues)];
  //
  //   var lineFunction = d3
  //     .line()
  //     .x(function(d) {
  //       return xScale(d.x);
  //     })
  //     .y(function(d) {
  //       return yScale(d.y);
  //     });
  //
  //   svg
  //     .append('path')
  //     .attr(
  //       'd',
  //       lineFunction([
  //         { x: 50, y: lsCoef[0].m * 50 + lsCoef[0].b },
  //         { x: 450, y: lsCoef[0].m * 450 + lsCoef[0].b },
  //       ])
  //     )
  //     .attr('stroke-width', 2)
  //     .attr('stroke', 'black')
  //     .attr('id', 'regline');
  // };

  var transitionline = function(data) {
    // const myXScale = d3
    //   .scaleLinear()
    //   .domain([
    //     d3.min(zScores, function(d) {
    //       return d[0];
    //     }),
    //     // 0,
    //     d3.max(zScores, function(d) {
    //       return d[0];
    //     }),
    //   ])
    //   .range([padding, w - padding * 2]);
    //
    // const myYScale = d3
    //   .scaleLinear()
    //   .domain([
    //     0,
    //     d3.max(zScores, function(d) {
    //       return d[1];
    //     }),
    //   ])
    //   .range([h - padding, padding]);

    var xValues = data.map(function(d) {
      return xScale(d.x);
    });
    var yValues = data.map(function(d) {
      return yScale(d.y);
    });

    var lsCoef = [LeastSquares(xValues, yValues)];

    var lineFunction = d3
      .line()
      .x(function(d) {
        return d.x;
      })
      .y(function(d) {
        return d.y;
      });

    // console.log(
    //   lineFunction([
    //     { x: 50, y: lsCoef[0].m * 50 + lsCoef[0].b },
    //     { x: 450, y: lsCoef[0].m * 450 + lsCoef[0].b },
    //   ])
    // );

    svg
      .append('path')
      .attr(
        'd',
        lineFunction([
          { x: 50, y: lsCoef[0].m * 50 + lsCoef[0].b },
          { x: 450, y: lsCoef[0].m * 450 + lsCoef[0].b },
        ])
      )
      .attr('stroke-width', 2)
      .attr('stroke', 'black');
  };

  // transitionline(objZScores);

  const linearRegression = ss.linearRegression(
    objZScores.map(d => {
      return [d.x, d.y];
    })
  );

  const linearRegressionLine = ss.linearRegressionLine(linearRegression);

  const regressionPoints = data => {
    const firstX = data[0].x;
    const lastX = data.slice(-1)[0].x;
    const xCoordinates = [firstX, lastX];

    return xCoordinates.map(d => ({
      x: d, // We pick x and y arbitrarily, just make sure they match d3.line accessors
      y: linearRegressionLine(d),
    }));
  };

  const line = d3
    .line()
    .x(d => xScale(d.x))
    .y(d => yScale(d.y));

  svg
    .append('path')
    .classed('regressionLine', true)
    .datum(regressionPoints(objZScores))
    .attr('d', line)
    .attr('stroke', 'black')
    .attr('stroke-width', 2);

  //x axis
  svg
    .append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + (h - padding) + ')')
    .call(xAxis);

  //y axis
  svg
    .append('g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(' + padding + ', 0)')
    .call(yAxis);

  // svg
  //   .append('rect')
  //   .attr('x', w)
  //   .attr('y', 100)
  //   .attr('clip-path', 'url(#regression-clip)')
  //   .style('fill', 'white')
  //   .attr('height', 100)
  //   .attr('width', w);

  // const x = d3
  //   .scaleBand()
  //   .domain(data.map(d => d.label))
  //   .rangeRound([0, chartWidth])
  //   .paddingInner(innerPadding)
  //   .paddingOuter(outerPadding);
  // const maxY = d3.max(data, d => d.value);
  // const y = d3
  //   .scaleLinear()
  //   .range([height, 0])
  //   .domain([0, maxY]);
  // //
  // const svg = d3
  //   .select(el)
  //   .append('svg')
  //   .attr('width', width)
  //   .attr('height', height + margin.top + margin.bottom)
  //   .append('g', 'chart')
  //   .attr('fill', '#fff')
  //   .attr('transform', `translate(${margin.left}, ${margin.top})`);
  //
  //
  // const yG = svg.append('g').call(
  //   d3
  //     .axisLeft(y)
  //     .ticks(Math.min(4, maxY))
  //     .tickSize(-chartWidth)
  //     .tickSizeOuter(0)
  // );
  //
  // yG.selectAll('path').style('stroke', 'none');
  // yG.selectAll('line').style('stroke', yAxisStyle.stroke);
  // yG.selectAll('text')
  //   .style('fontSize', yAxisStyle.fontSize)
  //   .style('fill', yAxisStyle.textFill);
  //
  // svg
  //   .append('text')
  //   .attr('transform', 'rotate(-90)')
  //   .attr('y', 0 - margin.left)
  //   .attr('x', 0 - height / 2)
  //   .attr('dy', '1em')
  //   .style('text-anchor', 'middle')
  //   .style('fontSize', yAxisStyle.fontSize)
  //   .style('fontWeight', yAxisStyle.fontWeight)
  //   .attr('fill', yAxisStyle.textFill)
  //   .text(yAxis.title || '');
  //
  // const xG = svg
  //   .append('g')
  //   .attr('transform', `translate(0, ${height})`)
  //   .call(d3.axisBottom(x));
  //
  // xG.selectAll('text')
  //   .style('text-anchor', 'end')
  //   .style('fontSize', xAxisStyle.fontSize)
  //   .style('fontWeight', xAxisStyle.fontWeight)
  //   .attr('fill', xAxisStyle.textFill)
  //   .attr('dx', '-1em')
  //   .attr('dy', '.15em')
  //   .attr('transform', 'rotate(-45)');
  //
  // xG.selectAll('path').style('stroke', xAxisStyle.stroke);
  //
  // xG.selectAll('line').style('stroke', xAxisStyle.stroke);
  //
  // xG.selectAll('.tick')
  //   .data(data)
  //   .on('mouseenter', d => {
  //     setTooltip(d.tooltip);
  //   })
  //   .on('mouseleave', () => {
  //     setTooltip();
  //   });
  return el.toReact();
};

export default compose(
  withTheme,
  withTooltip,
  withState('chart', 'setState', <span />),
  withSize({ refreshRate: 16 }),
  pure
)(QQPlot);
