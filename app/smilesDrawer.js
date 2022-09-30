import SmilesDrawer from 'smiles-drawer';
import * as d3 from 'd3'

const options = {
   nLevels: 5,
   Ttime: 500,
   toColor: "#0000ff"
}

export function DrawSmilesSvg(smiles, className = "", widthScale = 2, options = {compactDrawing: true}) {
   var drawer = new SmilesDrawer.SvgDrawer(options);

   try {
      const tree = SmilesDrawer.Parser.parse(smiles)
      const svg = document.createElementNS('http://www.w3.org/2000/svg',"svg")

      svg.setAttributeNS(null, "version", "1.1")
      svg.setAttributeNS(null, "preserveAspectRatio", "xMidYMin")
      svg.setAttribute("class", className)

      drawer.draw(tree, svg, 'light', false)

      svg.setAttribute("width", Math.round(drawer.svgWrapper.drawingWidth * (widthScale)))
      svg.querySelectorAll(".debug").forEach(x => x.remove())

      var vcoords = drawer.preprocessor.graph.vertices.map(v =>{
         return [Number(v.position.x), Number(v.position.y)]
      });

      return {svg, drawer, vcoords}
   } catch (e) {
    throw e
   }
}

function dotColor(x, level, stops) {
  return level === 0 ? x : stops[stops.length - level - 1]
}

function dotRadius(x, level, stops) {
  if (level==0) return stops[0]**0.5

  var offset = 1 - stops[level]
  var R = x - offset
  return R < stops[0] ? 0.0 :  R** 0.5
}

export function setColor(svg, color="green") {
   svg.querySelectorAll("linearGradient").forEach(x => x.remove())
   svg.querySelectorAll("line").forEach(x => x.setAttribute("stroke", color))
   svg.querySelectorAll("text,tspan").forEach(x => x.setAttribute("fill", color))
   return svg
}

const stops = [...Array(options.nLevels).keys()].map(x => (x + 1) / options.nLevels)

// TODO: could not import interpolateOkla
// function mycolor (fromColor) {
//    return(
//       d3.scaleLinear()
//       .domain([0,1])
//       .range(["white", options.toColor])
//       .interpolate(interpolateOkla)
//    )
// }

export async function showDots(svg, values, scale=11) {

 function comparator(x, y) {
    var Rx = dotRadius(x[5], x[2], stops)
    var Ry = dotRadius(y[5], y[2], stops)

    var Cx = dotColor(x[5], x[2], stops)
    var Cy = dotColor(y[5], y[2], stops)
    var Lx = x[2] == 0 ? 0 : x[2]
    var Ly = y[2] == 0 ? 0 : y[2]

    if (x[5] === y[5]) return Ly - Lx

    return Cx - Cy
 }

 await svg.selectAll('circle')
  .data(values, (v) => v[0])
  .join('circle')
    .attr("cx", (x) => x[3])
    .attr("cy", (x) => x[4])
    .sort(comparator)
    .attr("r", (x) =>  scale * dotRadius(x[5], x[2], stops))
   //  .attr("fill",(x) => mycolor(dotColor(x[5], x[2], stops)))
    .attr("fill",(x) => "#420a91")

  return svg
}

export function PackRandomValues(x, y, values) {
  return Array.from({length: values.length * stops.length}, (d,i) => {
     var il = Math.floor(i/values.length)
     var iv = i % values.length
     return [i, iv, il, x[iv],y[iv], values[iv], ]
  })
}

export function PackLinearValues(x, y, values) {
   const results = [];
   const valuesSum = values.reduce((acc, val) => {return acc + val;}, 0)
   for (let i = 0; i < x.length; i++) {
      const x_coord = x[i];
      const y_coord = y[i];
      const val = values[i];

      results.push([i, i, 0, x_coord, y_coord, val])
   }

   return results;
}
