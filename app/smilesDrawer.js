import SmilesDrawer from 'smiles-drawer';
import * as d3 from 'd3'

// import { createHTMLWindow } from 'svgdom';
// const window = createHTMLWindow()
// const document = window.document

// export function DrawSmilesSvg(smiles,  className = "", widthScale = 2, options = {compactDrawing: false}) {
// //    var smilesDrawer = new SmilesDrawer.Drawer(options);
//     var drawer = new SmilesDrawer.SvgDrawer(options);

//    try {
//       const tree = SmilesDrawer.Parser.parse(smiles)
//       const svg = document.createElementNS('http://www.w3.org/2000/svg',"svg")

//        svg.setAttributeNS(null, "version", "1.1")
//        svg.setAttributeNS(null, "preserveAspectRatio", "xMidYMin")
//        svg.setAttribute("class", className)

//        drawer.draw(tree, svg, 'light', false)

//        svg.setAttribute("width", Math.round(drawer.svgWrapper.drawingWidth * (widthScale)))
//        svg.querySelectorAll(".debug").forEach(x => x.remove())

//        var vcoords = drawer.preprocessor.graph.vertices.map(v =>{
// 	     return [Number(v.position.x), Number(v.position.y)]
//        })
// //       console.table(vcoords)
//        return {svg, drawer, vcoords}
//   } catch (e) {
//      throw e
//    }
// }

// function getStops(nLevels) {
//    return [...Array(nLevels).keys()].map(x => (x + 1) / nLevels)
// }

// stops = getStops(5)

// function dotRadius(x, level, stops) {
//   if (level==0) return stops[0]**0.5

//   var offset = 1 - stops[level]
//   var R = x - offset
//   return R < stops[0] ? 0.0 :  R** 0.5
// }

// function dotColor(x, level, stops) {
//   return level === 0 ? x : stops[stops.length - level - 1]
// }

// function mycolor() {
//    return(
//       d3.scaleLinear()
//          .domain([0,1])
//          .range(["white", "#0000ff"])
//          .interpolate(interpolateOkla)
//    )
// }

// function interpolateOkla() {
//    return(
//       (a, b) => {
//          return (x) => interpolate_colors(d3color.hcl(a), d3color.hcl(b), x, OklabHcl).rgb().toString()
//       }
//    )
// }

// async function showDots(svg, data, stops, scale = 11) {
//    function comparator(x, y) {
//       var Rx = d3.dotRadius(x[5], x[2], stops)
//       var Ry = dotRadius(y[5], y[2], stops)

//       var Cx = dotColor(x[5], x[2], stops)
//       var Cy = dotColor(y[5], y[2], stops)
//       var Lx = x[2] == 0 ? 0 : x[2]
//       var Ly = y[2] == 0 ? 0 : y[2]
//       return Cx - Cy
//    }

//    await svg.selectAll('circle')
//     .data(data, (v) => v[0])
//     .join('circle')
//       .attr("cx", (x) => x[3])
//       .attr("cy", (x) => x[4])
//       .sort(comparator)
//       .transition()
//       .ease(d3.easePolyInOut)
//       .duration(500)
//       .attr("r", (x) =>  scale * dotRadius(x[5], x[2], stops))
//       .attr("fill",(x) => mycolor(dotColor(x[5], x[2], stops)))
//       .end()

//     return svg
// }

// export function setColor(svg, color="black") {
//    svg.querySelectorAll("linearGradient").forEach(x => x.remove())
//    svg.querySelectorAll("line").forEach(x => x.setAttribute("stroke", "black"))
//    svg.querySelectorAll("text,tspan").forEach(x => x.setAttribute("fill", "black"))
//    return svg
// }

// export function PackValues(x, y, values, stops) {
//    return Array.from({length: values.length * stops.length}, (d,i) => {
//       var il = Math.floor(i/values.length)
//       var iv = i % values.length
//       return [i, iv, il, x[iv],y[iv], values[iv], ]
//    })
//  }

export function DrawSmilesSvg(smiles, className = "", widthScale = 2, options = {compactDrawing: false}) {
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


// d3.select(drawing.svg)
//   .style("width", "100%")
//   .style("max-width", "400px")
//   .style("margins", "auto")
//   .style("padding", "3em")
//   .style("overflow", "visible")