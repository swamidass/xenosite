import SmilesDrawer from 'smiles-drawer'
// import CleanCSS from 'clean-css'
import {useRef, useEffect, useLayoutEffect} from 'react'
import {pure} from 'recompose'
// const cssclean = new CleanCSS()
// const minifystyle = input => cssclean.minify(`*{${input}}`).styles.slice(2,-1)

function setColor(svg, color="black") {	
   svg.querySelectorAll("linearGradient").forEach(x => x.remove())
   svg.querySelectorAll("line").forEach(x => x.setAttribute("stroke", "black"))
   svg.querySelectorAll("text").forEach(x => x.setAttribute("fill", "black"))
}


export  function drawSmilesSvg(smiles, document, className = "", widthScale = 2, options = {compactDrawing: false}) {
    var smilesDrawer = new SmilesDrawer.Drawer(options);
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


export const MolDepict = pure(({smi, svg="", widthScale, className, ...props}) => {
	const disp = useRef()
    const log = useRef()

	useEffect(() => {
     try{
	   const { svg } = drawSmilesSvg(smi, document, className="mx-auto max-w-full", widthScale)
     //  console.log(svg)
	   disp.current.innerHTML = svg.outerHTML
       log.current.innerHTML = ""
     } catch (e) {
         log.current.innerHTML = e.message
     }
    }, [smi, disp])


	return <div className=""> 
      	<div className="text-red-500 text-xs text-center mx-autos mb-5" ref={log} />
    	<div className={"moldepict w-fit max-w-full mx-auto " + className} ref={disp} {...props} dangerouslySetInnerHTML={{__html: svg}}/> 
	</div>
} )