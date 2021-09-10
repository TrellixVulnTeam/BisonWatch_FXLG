import * as d3 from "d3";
import { sankey as Sankey, sankeyLinkHorizontal as SLH } from 'd3-sankey';
import { loadTitanicDataset } from "../titanic"; 
import { loadBisonDataset } from "../bison";
import d3_colorLegend from "https://api.observablehq.com/@d3/color-legend.js?v=3"



// Importe für alte Visualisierungen
/*import { discretize } from "./vislibs/discretize";
import { parallelsets } from "./vislibs/parallelsets";
import { mosaicplot, sliceAndDice } from "./vislibs/mosaicplot";
import { createHierarchy } from "./vislibs/hierarchy"; */
import marked from "marked";
import result from "./result.md";



//
// Parallel Set Bison Daten
// 
// Load Bison Data 
loadBisonDataset().then((bisond) => {



  //d3.select("div#result").html(marked(result));

  output_selection(bisond.slice(0, 20))

  console.log(bisond);

  bisond.map((d) => {
    if (d.sws < 3) d.sws = "0-3"
    else if (d.sws < 6) d.sws = "4-6"
    else if (d.sws < 12) d.sws = "8-12"
    else if (d.sws <= 18) d.sws = "16-18"
    else d.sws = "Keine Angabe"
    return d    
  })


  var width = 975
  var height = 720 
  
  var colors = new Map().set("Fakultät Architektur und Urbanistik", "#009BB4")
                  .set("Fakultät Bauingenieurwesen", "#F39100")
                  .set("Fakultät Kunst und Gestaltung", "#94C11C")
                  .set("Fakultät Medien", "#006B94")
                  .set("Sonstiges", "grey")

  function color (faculty) {
    var color = colors.get(faculty)
    
    if (color == undefined){
      return "grey"
    }
    return colors.get(faculty)
  }
  
   
  var data = bisond
  var keys = ["faculty", "day", "sws", "language"]
  var svg = d3.select("#parallel_set").attr("width", width).attr("height", height); 
  var svg2 = d3.select("#legend")


  var sankey = Sankey()
        .nodeSort(null)
        .linkSort(null)
        .nodeWidth(8)
        .nodePadding(20)
        .extent([[0, 5], [width, height - 5]])

  let index = -1;
  var nodes = [];
  const nodeByKey = new Map;
  const indexByKey = new Map;
  var links = [];

  for (const k of keys) {
    for (const d of data) {
      const key = JSON.stringify([k, d[k]]);
      if (nodeByKey.has(key)) continue;
      const node = {name: d[k]};
      nodes.push(node);
      nodeByKey.set(key, node);
      indexByKey.set(key, ++index);
    }
  }

  for (let i = 1; i < keys.length; ++i) {
    const a = keys[i - 1];
    const b = keys[i];
    const prefix = keys.slice(0, i + 1);
    const linkByKey = new Map;
    for (const d of data) {
      const names = prefix.map(k => d[k]);
      const key = JSON.stringify(names);
      const value = d.value || 1;
      let link = linkByKey.get(key);
      if (link) { link.value += value; continue; }
      link = {
        source: indexByKey.get(JSON.stringify([a, d[a]])),
        target: indexByKey.get(JSON.stringify([b, d[b]])),
        names,
        value
      };
      links.push(link);
      linkByKey.set(key, link);
    }
  }

  var graph = {nodes, links};

  var {nodes, links} = sankey({
    nodes: graph.nodes.map(d => Object.assign({}, d)),
    links: graph.links.map(d => Object.assign({}, d))
  });

  
  svg.append("g")
      .selectAll("rect")
      .data(nodes)
      .join("rect")
      .attr("fill", "LightGrey")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0)
      // click function to fill bars
      .on("click", function(d) { 
        if (d3.select(this).attr("fill") == "red") {
          d3.select(this).attr("fill", "LightGrey")
        } else d3.select(this).attr("fill", "red")
      })
      .append("title")
      .text(d => `${d.name}\n${d.value.toLocaleString()}`);

  svg.append("g")
      .attr("fill", "none")
      .selectAll("g")
      .data(links)
      .join("path")
      .attr("d", SLH())
      .attr("stroke", d => color(d.names[0]))
      .attr("stroke-width", d => d.width)
      .style("mix-blend-mode", "multiply")
      .append("title")
      .text(d => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);

  // function to redraw graph when clicking on bars 
  //function redraw() {
  //  svg.append("g").selectAll("path")
  //  .data(links)
  //  .join("path")
  //  .attr("fill", )
  //}

  svg.append("g")
      .style("font", "10px sans-serif")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .text(d => d.name)
      .append("tspan")
      .attr("fill-opacity", 0.7)
      .text(d => ` ${d.value.toLocaleString()}`);

  
  
  // Create legend vertical 
  svg2.append("circle").attr("cx",10).attr("cy",25).attr("r", 6).style("fill", "#009BB4")
  svg2.append("circle").attr("cx",10).attr("cy",45).attr("r", 6).style("fill", "#F39100")
  svg2.append("circle").attr("cx",10).attr("cy",65).attr("r", 6).style("fill", "#94C11C")
  svg2.append("circle").attr("cx",10).attr("cy",85).attr("r", 6).style("fill", "#006B94")
  svg2.append("circle").attr("cx",10).attr("cy",105).attr("r", 6).style("fill", "grey")
  svg2.append("text").attr("x", 20).attr("y", 30).text("Fakultät Architektur und Urbanistik")
  svg2.append("text").attr("x", 20).attr("y", 50).text("Fakultät Bauingenieurwesen").attr("alignment-baseline","middle")
  svg2.append("text").attr("x", 20).attr("y", 70).text("Fakultät Kunst und Gestaltung",).attr("alignment-baseline","middle")
  svg2.append("text").attr("x", 20).attr("y", 90).text("Fakultät Medien").attr("alignment-baseline","middle")
  svg2.append("text").attr("x", 20).attr("y", 110).text("Sonstiges").attr("alignment-baseline","middle")


  // Create legend horizontal, not working yet 

  /*
  svg2.append("circle").attr("cx",10).attr("cy",25).attr("r", 6).style("fill", "#009BB4")
  svg2.append("circle").attr("cx",(width/5)).attr("cy",25).attr("r", 6).style("fill", "#F39100")
  svg2.append("circle").attr("cx",(width/5)*2).attr("cy",25).attr("r", 6).style("fill", "#94C11C")
  svg2.append("circle").attr("cx",(width/5)*3).attr("cy",25).attr("r", 6).style("fill", "#006B94")
  svg2.append("circle").attr("cx",(width/5)*4).attr("cy",25).attr("r", 6).style("fill", "grey")

  svg2.append("text").attr("x", 20).attr("y", 30).text("Fakultät Architektur und Urbanistik").attr("width", width/5 - 10)
  svg2.append("text").attr("x", ((width/4)+10)).attr("y", 30).text("Fakultät Bauingenieurwesen")
  svg2.append("text").attr("x", ((width/4)*1)).attr("y", 30).text("Fakultät Kunst und Gestaltung")
  svg2.append("text").attr("x", ((width/4)*2)+10).attr("y", 30).text("Fakultät Medien")
  svg2.append("text").attr("x", ((width/4)*3)+10).attr("y", 30).text("Sonstiges")
  
  svg2.selectAll().remove()
  colors = d3.scaleOrdinal(["Fakultät Architektur und Urbanistik", "Fakultät Bauingenieurwesen", "Fakultät Kunst und Gestaltung", "Fakultät Medien", "Sonstiges"], d3.schemeCategory10)
  Swatches(colors)
  */
  

  /**
   * Write selection in a table on the html site
   *
   * @param selection An array of course objects
   */
  function output_selection(selection) {
    var table = d3.select("div#result").select("#resulttable")
    var table_header = table.append("tr")

    // generate base url to the lecturer network visualisation
    var lecturer_network_url = window.location.toString().split("/")
    lecturer_network_url.pop()
    lecturer_network_url.pop()
    lecturer_network_url.push("lecturer_network")
    lecturer_network_url = new URL(lecturer_network_url.join("/"))

    // generate table header
    table_header.append("th").text("Veransstaltungstitel")
    table_header.append("th").text("Lehrpersonen")

    // generate entry for each course in the selection
    selection.forEach(course => {
      var table_row = table.append("tr")

      // write course title with link to bison in the table
      table_row.append("td").append("a")
        .attr("href", course.internalLink)
        .text(course.courseTitle)

      // write lecturers with custom query link to our lecturer network in the table
      var lec_item = table_row.append("td")
      if (course.lecturers.length > 1) {
      course.lecturers.forEach((lecturer) => {
        lecturer_network_url.searchParams.set("lecturer", lecturer.name)
        lec_item.append("a")
        .attr("href", lecturer_network_url.href)
        .text(lecturer.name)
        lec_item.append("text").text(", ")
        lec_item.append("br")
        }
      )} else {
        lecturer_network_url.searchParams.set("lecturer", course.lecturers[0].name)
        lec_item.append("a")
        .attr("href", lecturer_network_url.href)
        .text(course.lecturers[0].name)
      }
    });
  }
});

