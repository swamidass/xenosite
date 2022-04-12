import SmilesDrawer from 'smiles-drawer'
// import { createHTMLWindow } from 'svgdom';
// const window = createHTMLWindow()
// const document = window.document

function setColor(svg, color="black") {	
   svg.querySelectorAll("linearGradient").forEach(x => x.remove())
   svg.querySelectorAll("line").forEach(x => x.setAttribute("stroke", "black"))
   svg.querySelectorAll("text").forEach(x => x.setAttribute("fill", "black"))
}

export  function DrawSmilesSvg(smiles,  className = "", widthScale = 2, options = {compactDrawing: false}) {
//    var smilesDrawer = new SmilesDrawer.Drawer(options);
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
       }) 
//       console.table(vcoords)
       return {svg, drawer, vcoords}
  } catch (e) {
     throw e	
   }
}


