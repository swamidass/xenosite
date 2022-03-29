
import SmilesDrawer from 'smiles-drawer'

import {parseHTML} from 'linkedom';
var {document, window} = parseHTML(``);
globalThis.document = document

function draw(smiles, options = {}) {
    var smilesDrawer = new SmilesDrawer.Drawer(options);
    var svgDrawer = new SmilesDrawer.SvgDrawer(options);
    
    return new Promise((resolve, reject) => {  
        SmilesDrawer.parse(smiles, resolve, reject)
    })
    
    .then((tree) =>  {
       let svg = document.createElement("svg")
       svgDrawer.draw(tree, svg, 'light', false)
       
       var coords = svgDrawer.svgWrapper.vertices.map(v =>{
         return [Number(v.getAttribute('x')), Number(v.getAttribute('y'))]
       }) 
         
       return {svg, coords}
       }
    )
}

const {svg, coords} = await draw("CCC1CO")

svg.querySelectorAll(".debug").forEach(x => x.remove())

// console.log(coords)

console.log(svg.outerHTML)
