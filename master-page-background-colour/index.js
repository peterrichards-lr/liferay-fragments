const enableDebug = configuration.enableDebug

const hexToRgb = (hex) => {
  var r, g, b;
  if (hex && (hex.length == 6 || hex.length == 7)) {
    const offset = hex.length == 6 ? 0 : 1;
    r = parseInt(colour.substr(0 + offset, 2), 16);
    g = parseInt(colour.substr(2 + offset, 2), 16);
    b = parseInt(colour.substr(4 + offset, 2), 16);
  }
  return { r, g, b };
};

const applyTint = (rgb, tint_factor) => {
  var newR, newG, newB;
  var { r, g, b } = rgb;
  newR = r + (255 - r) * tint_factor;
  newG = g + (255 - g) * tint_factor;
  newB = b + (255 - b) * tint_factor;
  return { r: newR, g: newG, b: newB };
};

var colour = configuration.colour;;
if (colour.indexOf('var(') == 0) {
	const property = colour.replace('var(','').replace(')','');
	const style = getComputedStyle(document.body);
	if (enableDebug)
		console.debug('style', style);
	const propertyValue = style.getPropertyValue(property);
	if (enableDebug)
		console.debug('propertyValue', propertyValue);
	colour = propertyValue;
} else if(colour.indexOf('#') == -1) {
	colour = '#ffffff';
}
if (enableDebug)
	console.debug('colour', colour);

const tint = parseFloat(configuration.tint);
if (enableDebug)
	console.debug('tint', tint);

const rgb = hexToRgb(colour);
if (enableDebug)
	console.debug('rgb', rgb);
const newRgb = applyTint(rgb, tint);
if (enableDebug)
	console.debug('newRgb', newRgb);

const mainContent = document.querySelector('#main-content');
if (enableDebug)
	console.debug('mainContent', mainContent);

const colourString = `rgb(${newRgb.r},${newRgb.g},${newRgb.b})`;
if (enableDebug)
	console.debug('colourString', colourString);
mainContent.style.backgroundColor = colourString;
if (mainContent.classList.contains("layout-content") == false) {
	mainContent.classList.add("container-fluid", "container-fluid-max-xl");
}
