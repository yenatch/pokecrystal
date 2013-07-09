
var tld = '../../';

var blockdata_dir   = tld + 'maps/';
var tiles_dir       = tld + 'gfx/tilesets/';
var palette_dir     = tld + 'tilesets/';
var metatiles_dir   = tld + 'tilesets/';
var collision_dir   = tld + 'tilesets/';
var palette_map_dir = tld + 'tilesets/';
var asm_dir         = tld + 'maps/';
var ow_dir          = tld + 'gfx/overworld/';


function constants(asm) {
	var consts = {};
	var lines = asm.split('\n');
	for (var l = 0; l < lines.length; l++) {
		var line = separateComment(lines[l])[0];
		if (line.indexOf('EQU') !== -1) {
			var con = line.split('EQU')[0].trim();
			var val = line.split('EQU')[1].trim();
			consts[con] = parseInt(val.replace('$','0x'));
			if (consts[con] === NaN) {
				consts[con] = consts[val];
			}
		}
	}
	return consts;
}

function getMapConstant(con) {
	var val = map_constants[con];
	if (val === undefined) return con;
	return val;
}

var map_constants = constants(loadTextFile(tld + 'constants/map_constants.asm'));



function main() {
	init();
}

function init() {
	controller = new Controller();
}



// map readers

var mapHeaders = loadTextFile(asm_dir + 'map_headers.asm');
var secondMapHeaders = loadTextFile(asm_dir + 'second_map_headers.asm');

function secondMapHeader(asm, mapName) {
	var header = asmAtLabel(asm, mapName + '_SecondMapHeader');
	var items = [];
	var macros = [ 'db', 'db', 'dbw', 'dbw', 'dw', 'db' ];
	var attributes = [
		'border_block',
		'height',
		'width',
		'blockdata_bank',
		'blockdata_label',
		'script_header_bank',
		'script_header_label',
		'map_event_header_label',
		'connections',
	];
	var i = 0;
	for (var l = 0; l < header.length; l++) {
		var asm     = header[l][0];
		var comment = header[l][1];

		if (asm.trim() !== '') {
			items = items.concat(macroValues(asm, macros[i]));
			i++;
		}
		if (items.length === attributes.length) {
			l++;
			break;
		}
	}

	var attrs = listsToDict(attributes, items);
	attrs['connections'] = connections(attrs['connections'], header.slice(l));
	return attrs;
}


function connections(conns, header) {
	var directions = { 'north': {}, 'south': {}, 'west': {}, 'east': {} };
	
	var macros = [ 'db', 'dw', 'dw', 'db', 'db', 'dw' ];
	var attributes = [
		'map_group',
		'map_no',
		'strip_pointer',
		'strip_destination',
		'strip_length',
		'map_width',
		'y_offset',
		'x_offset',
		'window'
	];

	for (d in directions) {
		if (conns.search(d.toUpperCase()) !== -1) {
			var i = 0;
			var items = [];
			for (var l = 0; l < header.length; l++) {
				var asm     = header[l][0];
				var comment = header[l][1];

				if (asm.trim() !== '') {
					items = items.concat(macroValues(asm, macros[i]));
					i++;
				}
				if (items.length === attributes.length) {
					l++;
					break;
				}
			}
			directions[d] = listsToDict(attributes, items);
		}
	}

	return directions;
}


function mapHeader(asm, mapName) {
	var header = asmAtLabel(asm, mapName + '_MapHeader');
	var macros = [ 'db', 'dw', 'db' ];
	var items = [];
	var attributes = [
		'bank',
		'tileset_id',
		'permission',
		'second_map_header',
		'world_map_location',
		'music',
		'time_of_day',
		'fishing_group'
	];
	var i = 0;
	for (var l = 0; l < header.length; l++) {
		var asm     = header[l][0];
		var comment = header[l][1];

		if (asm.trim() !== '') {
			items = items.concat(macroValues(asm, macros[i]));
			i++;
		}
		if (items.length === attributes.length) {
			l++;
			break;
		}
	}
	return listsToDict(attributes, items);
}


function readHeader(header, classes) {
	var objects = {};
	var l = 0;
	for (var i in classes) {
		objects[i] = [];
		var count = -1;
		while (l < header.length) {
			var asm     = header[l][0];
			var comment = header[l][1];

			if (asm.trim() !== '') {
				if (count === -1) {
					count = parseInt(dbValue(asm));
					if (count === 0) {
						l++;
						break;
					}
				} else if (objects[i].length < count) {
					objects[i].push(new classes[i](asm));
				} else {
					break;
				}
			}
			l++;
		}
	}
	return objects;
}


function scriptHeader(asm, mapName) {
	var header = asmAtLabel(asm, mapName + '_MapScriptHeader');
	var classes = {
		triggers: Trigger,
		callbacks: Callback
	};
	return readHeader(header, classes);
}

var Trigger = function(asm) {
	return macroValues(asm, 'dw');
}

var Callback = function(asm) {
	return macroValues(asm, 'dbw');
}


function eventHeader(asm, mapName) {
	var header = asmAtLabel(asm, mapName + '_MapEventHeader');
	var classes = {
		unknown: function(){}, // "filler"
		warp_def: Warp,
		xy_trigger: XYTrigger,
		signpost: Signpost,
		person_event: PersonEvent
	};
	return readHeader(header, classes);
}

var Warp = function(asm) {
	var attributes = [
		'y',
		'x',
		'warp_id',
		'map_group',
		'map_no'
	];
	var values = macroValues(asm, 'warp_def');
	for (var i = 0; i < attributes.length; i++) {
		this[attributes[i]] = values[i];
	}
}

var XYTrigger = function(asm) {
        var attributes = [
        	'number',
        	'y',
        	'x',
        	'unknown1',
        	'script',
        	'unknown2',
        	'unknown3'
        ];
	var values = macroValues(asm, 'xy_trigger');
	for (var i = 0; i < attributes.length; i++) {
		this[attributes[i]] = values[i];
	}
}

var Signpost = function(asm) {
	var attributes = [
		'y',
		'x',
		'function',
		'pointer',
	];
	var values = macroValues(asm, 'signpost');
	for (var i = 0; i < attributes.length; i++) {
		this[attributes[i]] = values[i];
	}
}

var PersonEvent = function(asm) {
	var attributes = [
		'pic',
		'y',
		'x',
		'facing',
		'movement',
		'clock_hour',
		'clock_daytime',
		'color_function',
		'sight_range',
		'pointer',
		'bit_no'
	];
	var values = macroValues(asm, 'person_event');
	for (var i = 0; i < attributes.length; i++) {
		this[attributes[i]] = values[i];
	}
}



// console tools
function fill(tile_id) {
	controller.painters[0].map.blockdata = '';
	for (var i=0; i<controller.painters[0].map.width*controller.painters[0].map.height; i++) {
		controller.painters[0].map.blockdata += String.fromCharCode(tile_id|0);
	}
	controller.painters[0].map.draw();
}

function tileset(tileset_id) {
	var old_blk = controller.painters[0].map.blockdata;
	controller.painters[0] = new Painter(getCustomMap(controller.painters[0].map.id, controller.painters[0].map.name, controller.painters[0].map.width, controller.painters[0].map.height, tileset_id));
	controller.painters[0].map.blockdata = old_blk;
	controller.picker = new Picker(controller.painters[0].map);
}

function resize(width, height, filler_tile) {
	filler_tile = (filler_tile || 1) | 0;

	var last_width = controller.painters[0].map.width;
	var last_height = controller.painters[0].map.height;
	if (last_width === width && last_height === height) return;

	var blk = controller.painters[0].map.blockdata;

	if (last_width < width) {
		// append filler tiles to each row
		var rows = []
		for (var row = 0; row < last_height; row++) {
			rows.push(blk.substr(last_width * row, last_width));
		}
		blk = ''
		for (var r = 0; r < rows.length; r++) {
			for (var i = 0; i < (width - last_width); i++) {
				rows[r] += String.fromCharCode(filler_tile);
			}
			blk += rows[r]
		}
	} else if (last_width > width) {
		// remove tiles from each row
		var rows = []
		for (var row = 0; row < last_height; row++) {
			rows.push(blk.substr(last_width * row, width));
		}
		blk = ''
		for (r=0;r<rows.length;r++) {
			blk += rows[r]
		}
	}

	if (last_height < height) {
		// append filler rows to the bottom
		for (var row = 0; row < (height - last_height); row++) {
			for (var i=0; i < width; i++) {
				blk += String.fromCharCode(filler_tile);
			}
		}
	} else if (last_height > height) {
		// remove rows from the bottom
		blk = blk.substr(0, width * height);
	}

	controller.painters[0] = new Painter(getCustomMap(controller.painters[0].map.id, controller.painters[0].map.name, width, height, controller.painters[0].map.tileset_id));
	controller.painters[0].map.blockdata = blk;
	controller.painters[0].map.draw();
}

function newblk(path) {
	var id = 0;
	var w = controller.painters[id].map.width;
	var h = controller.painters[id].map.height;
	var t = controller.painters[id].map.tileset_id;
	controller.painters[id] = new Painter(getCustomMap(id, undefined, w, h, t, path));
	controller.painters[id].map.draw();
}

function newmap(w, h, name) {
	var id = 0;
	w = w || 20;
	h = h || 20;
	controller.painters[id] = new Painter(getCustomMap(id, undefined, w, h));
	controller.picker = new Picker(controller.painters[id].map);
}



// ui

function updatePaintTile(painttile) {
	if (document.forms['ptile']) {
		document.forms['ptile']['ptilei'].value = painttile;
	}
	for (var i = 0; i < controller.painters.length; i++) {
		controller.painters[i].paint_tile = painttile || 0;
	}
}

var Controller = function() {
	var selfC = this;

	this.painters = [];
	
	this.bar = document.createElement('div');
	this.bar.id = 'bar';
	this.bar.className = 'bar';
	
	this.newMapButton = document.createElement('div');
	this.newMapButton.innerHTML = 'New';
	this.newMapButton.onclick = function(e) {
		var id = 0;
		if (!selfC.painters[id] || window.confirm('Overwrite existing map?')) { newmap(); }
	};
	
	this.openButton = document.createElement('div');
	this.openButton.innerHTML = 'Open';
	this.openButton.onclick = function(e) {
		if (!document.getElementById('opendialog')) {
			var openDialog = document.createElement('div');
			openDialog.id = 'opendialog';

			var openForm = document.createElement('form');
			openForm.id = 'open';
			
			function HTMLAttributes(attrs) {
				attrs = attrs || {};
				var str = '';
				for (attr in attrs) {
					str += ' ' + attr + '=' + attrs[attr];
				}
				return str;
			}
			var blk = '<input' + HTMLAttributes({
				id: 'blk',
				value: tld + 'maps/GoldenrodCity.blk',
				autocomplete: 'on'
			}) + '>';
			var tileset = '<input' + HTMLAttributes({
				id: 'tileset',
				value: '2'
			}) + '>';
			var width = '<input' + HTMLAttributes({
				id: 'width',
				value: '20'
			}) + '>';
			var height = '<input' + HTMLAttributes({
				id: 'height',
				value: '18'
			}) + '>';

			var nameInput = '<input' + HTMLAttributes({
				id: 'name',
				value: '"Goldenrod City"'
			}) + '>';
			openForm.innerHTML = 'Name:<br>' + nameInput + '<br><input id="open" name="open" type="submit" value="Open">';

			var closeForm = document.createElement('form');
			closeForm.id = 'close';
			closeForm.innerHTML = '<input id="close" name="close" type="submit" value="OK">';
			
			openDialog.innerHTML = openForm.outerHTML + closeForm.outerHTML;
				
			openDialog.className = 'dialog';
			document.body.appendChild(openDialog);
			document.forms['open'].onsubmit = function(e) {
				e.preventDefault();

				var name = document.forms['open']['name'].value;
				name = name.capWords().replace(/\ /g, '');

				var id = 0; //selfC.painters.length || 0;
				selfC.painters[id] = new Painter(getMapById(name));
				selfC.picker = new Picker(selfC.painters[id].map);

				document.body.removeChild(document.getElementById('opendialog'));
				return false;
			};
			document.forms['close'].onsubmit = function(e) {
				e.preventDefault();
				document.body.removeChild(document.getElementById('opendialog'));
				return false;
			};
		}
	}
	
	this.saveButton = document.createElement('div');
	this.saveButton.innerHTML = 'Save';
	this.saveButton.onclick = function(e) {
		var blk = selfC.painters[0].map.blockdata;
		saveFile(blk);
	};
	
	this.pickerTileForm = document.createElement('div');
	this.pickerTileForm.className = 'barchild';
	this.pickerTileForm.innerHTML = '<form id="ptile"><input id="ptilei" type="text" name="ptile" maxlength="3" value="1" autocomplete="off"></form>';
	this.pickerTileForm.onsubmit = function(e) {
		updatePaintTile(document.forms['ptile']['ptilei'].value);
		return false;
	};
	
	this.pickerView = document.createElement('div');
	this.pickerView.id = 'picker';
	this.pickerView.className = 'picker';
	this.pickerView.addEventListener('mousewheel', function(e) {
		this.scrollTop -= (e.wheelDelta);
		e.preventDefault();
	}, false);

	this.pickerBar = document.createElement('div');
	this.pickerBar.id = 'pickerbar';
	this.pickerBar.className = 'pickerbar';
	this.pickerBar.appendChild(this.pickerView);
	
	this.divs = [this.newMapButton, this.openButton, this.saveButton]
	for (i=0; i<this.divs.length; i++) {
		this.divs[i].className = 'barchild';
		this.bar.appendChild(this.divs[i]);
	}
	document.body.appendChild(this.pickerBar);
	document.body.appendChild(this.bar);
	
	this.window = document.createElement('div');
	this.window.id = 'window';
	document.body.appendChild(this.window);
	
	return this;
}

var Picker = function(pmap) {
	var selfK = this;

	var blockdata = '';
	for (i=0; i<(pmap.tileset.metatiles.length); i++) {
		blockdata += String.fromCharCode(i);
	}
	var w = 4;
	var h = blockdata.length / w;

	selfK.map = getCustomMap('pickerc', undefined, w, h, pmap.tileset_id);
	selfK.map.blockdata = blockdata;

	selfK.getLastXY = function(e) {
		selfK.lastx = Math.floor(
			(e.pageX - selfK.map.canvas.getBoundingClientRect().left - window.scrollX)/(selfK.map.highlight.tilew*selfK.map.highlight.metaw),
			selfK.map.highlight.tilew
		);
		selfK.lasty = Math.floor(
			(e.pageY - selfK.map.canvas.getBoundingClientRect().top - window.scrollY)/(selfK.map.highlight.tileh*selfK.map.highlight.metah),
			selfK.map.highlight.tileh
		);
	}

	selfK.map.canvas.onclick = function(e) {
		updatePaintTile(selfK.lasty * selfK.map.width + selfK.lastx);
	};
	selfK.map.canvas.onmousemove = function(e) {
		selfK.getLastXY(e);
		selfK.map.draw();
		selfK.map.drawMetatile(
			selfK.map.blockdata.charCodeAt(selfK.lasty*selfK.map.width+selfK.lastx),
			selfK.lastx, selfK.lasty, selfK.map.highlight
		);
	};
	selfK.map.canvas.onmouseout = function(e) {
		selfK.map.draw();
	};
	selfK.map.canvas.oncontextmenu = function(e) {
		selfK.map.draw();
	};
	controller.pickerView.innerHTML = '';
	controller.pickerView.appendChild(selfK.map.canvas);
	controller.pickerBar.style.right = '0';
}

var Painter = function(pmap) {

	var selfP = this;
	
	this.map = pmap;
	controller.window.style.width = this.map.canvas.width + 'px';
	controller.window.style.height = this.map.canvas.height + 'px';
	controller.window.innerHTML = '';
	controller.window.appendChild(this.map.canvas);
	
	// tile paint
	
	this.paint_tile = 1;
	
	this.getLastXY = function(e) {
		selfP.lastx = Math.floor(
			(e.pageX - selfP.map.canvas.getBoundingClientRect().left - window.scrollX)/(selfP.map.highlight.tilew*selfP.map.highlight.metaw),
			selfP.map.highlight.tilew
		);
		selfP.lasty = Math.floor(
			(e.pageY - selfP.map.canvas.getBoundingClientRect().top - window.scrollY)/(selfP.map.highlight.tileh*selfP.map.highlight.metah),
			selfP.map.highlight.tileh
		);
	}

	this.checkPaint = function(e) {
		if (selfP.lasty === undefined || selfP.lastx === undefined) {
			selfP.getLastXY(e);
		}
		var blockPos = selfP.lasty*selfP.map.width+selfP.lastx;
		if (selfP.paintx !== selfP.lastx || selfP.painty !== selfP.lasty || selfP.paint_tile !== selfP.newtile) {
			selfP.paintx = selfP.lastx;
			selfP.painty = selfP.lasty;
			selfP.lasttile = selfP.map.blockdata.charCodeAt(blockPos);
			selfP.map.blockdata = selfP.map.blockdata.replaceCharCodeAt(blockPos, selfP.paint_tile);
			selfP.map.draw();
			selfP.map.drawMetatile(
				selfP.map.blockdata.charCodeAt(blockPos),
				selfP.paintx, selfP.painty, selfP.map.highlight
			);
			selfP.newtile = selfP.paint_tile;
		}
	}
	
	this.resetPaint = function(e) {
		selfP.paintint = setInterval(function(){selfP.checkPaint(e);}, 5);
	}
	
	this.stopPaint = function(e) {
		clearInterval(selfP.paintint);
		selfP.map.draw();
	}
	
	this.map.canvas.onmousedown   = function(e) { selfP.stopPaint(e); selfP.resetPaint(e); e.preventDefault(); }
	this.map.canvas.onmouseup     = function(e) { selfP.stopPaint(e); }
	this.map.canvas.onmouseout    = function(e) { selfP.stopPaint(e); }
	this.map.canvas.oncontextmenu = function(e) { selfP.stopPaint(e); }
	
	this.map.canvas.onmousemove = function(e) {
		try {
			selfP.map.drawMetatile(
				selfP.map.blockdata.charCodeAt(selfP.lasty*selfP.map.width+selfP.lastx),
				selfP.lastx, selfP.lasty, selfP.map.tileset
			);
		} catch(err) { };

		selfP.getLastXY(e);

		selfP.map.drawMetatile(
			selfP.map.blockdata.charCodeAt(selfP.lasty*selfP.map.width+selfP.lastx),
			selfP.lastx, selfP.lasty, selfP.map.highlight
		);
	}
	return this;
}


function getMapById(name) {
	return new Map(0, name);
}

function getCustomMap(id, name, width, height, tileset_id) {
	return new Map(id, name, width, height, tileset_id);
}

function getPickerMap(id, tileset_id) {
	return new Map(id, undefined, undefined, undefined, tileset_id);
}

var Map = function(id, name, width, height, tileset_id, blockfile) {
	var selfM = this;

	this.id = id;
	this.name = name;

	if (this.name) {
		var props = [mapHeader(mapHeaders, this.name), secondMapHeader(secondMapHeaders, this.name)];
		for (var i = 0; i < props.length; i++) {
			for (prop in props[i]) {
				this[prop] = props[i][prop];
			}
		}
		this.asm     = loadTextFile(asm_dir + this.name + '.asm');
		this.events  = eventHeader(this.asm, this.name);
		this.scripts = scriptHeader(this.asm, this.name);

		this.tileset_id = parseInt(this.tileset_id);
		this.blockfile = blockdata_dir + this.name + '.blk';

		this.width  = getMapConstant(this.width);
		this.height = getMapConstant(this.height);
	}

	if (tileset_id) this.tileset_id = tileset_id;
	this.tileset = new Tileset(this.tileset_id);
	this.tileset.img.onload = function() {
		selfM.tileset.getTileData();
		selfM.draw();
		if (selfM.events && selfM.events.person_event) {
			selfM.drawSprites();
		}
		controller.window.style.left = '0px';
	}
	this.highlight = new Tileset(this.tileset_id, 255);

	if (width)  this.width = width;
	if (height) this.height = height;
	this.width  = parseInt(this.width);
	this.height = parseInt(this.height);

	this.canvas  = canvas(
		this.id,
		this.width  * this.tileset.tilew * this.tileset.metaw,
		this.height * this.tileset.tileh * this.tileset.metah
	);
	this.context = this.canvas.getContext('2d');
	
	if (blockfile !== undefined) this.blockfile = blockfile;
	this.blockdata = '';

	if (this.blockfile === undefined) {
		this.newBlockData();
	} else {
		this.getBlockData();
	}

	return this;
};

Map.prototype.draw = function() {
	if (this.tileset.img.complete) {
		for (var y=0; y < this.height; y++) {
			for (var x=0; x < this.width; x++) {
				this.drawMetatile(
					this.blockdata.charCodeAt(y*this.width+x),
					x, y
				);
			}
		}
	}
};

Map.prototype.drawMetatile = function(id, tx, ty, tset) {
	var tset = tset || this.tileset;
	var pw = tset.metaw * tset.tilew * tx;
	var ph = tset.metah * tset.tileh * ty;
	var cur_tile = 0;
	for (var dy=0; dy < tset.metah; dy++) {
		for (var dx=0; dx < tset.metaw; dx++) {
			cur_tile = tset.metatiles[id][dy*tset.metaw+dx];
			
			// Tile gfx are split in half to make VRAM mapping easier.
			if (cur_tile >= 0x80) {
				cur_tile -= 0x20;
			}
			this.context.putImageData(
				tset.tiles[cur_tile],
				pw + dx * tset.tilew,
				ph + dy * tset.tileh
			);
		}
	}
}

Map.prototype.getBlockData = function() {
	var filename = this.blockfile ||
		blockdata_dir +
		this.name
		.replace(/\s+/g, '')
		.replace(/é/g,'e')
		.replace(/\'/g,'') +
		'.blk'
	;
	this.blockdata = getBinaryFile(filename);
}

Map.prototype.newBlockData = function() {
	this.blockdata = '';
	for (var i = 0; i < this.width * this.height; i++) {
		this.blockdata += String.fromCharCode(1|0);
	}
}

Map.prototype.drawSprites = function() {
	this.sprites = [];
	for (var i = 0; i < this.events.person_event.length; i++) {
		var person = this.events.person_event[i];
		this.sprites[i] = new Sprite(i, person.pic, (person.x - 4) * 16, (person.y - 4) * 16);
	}
}


var Tileset = function(id, alpha, tilew, tileh, metaw, metah, collw, collh) {
	this.id         = id    || 0;
	this.tilew      = tilew || 8;
	this.tileh      = tileh || 8;
	this.alpha      = alpha || 192;
	
	this.metaw      = metaw || 4;
	this.metah      = metah || 4;
	this.tiles      = [];
	
	this.collw      = collw || 2;
	this.collh      = collh || 2;
	this.collision  = [];
	
	this.palettemap = [];

	this.getPalettes();
	this.getPaletteMap();
	this.getMetatiles();
	
	this.img        = new Image();
	this.img.src    = tiles_dir + this.id.toString().zfill(2) + '.png';

	var selfT = this;
	this.img.onload = function() {
		selfT.getTileData();
	};

	return this;
};

Tileset.prototype.getTileData = function() {
	this.tiles = [];
	var imageData = getRawImage(this.img);
	var num_tiles = (imageData.width * imageData.height) / (this.tilew * this.tileh);
	for (var tile = 0; tile < num_tiles; tile++) {
		// Palette maps are padded to make vram mapping easier.
		var pal = this.palettemap[tile >= 0x60 ? tile + 0x20 : tile] & 0x7;
		this.tiles[tile] = flattenImageData(imageData, this.palettes[pal], this.tilew, this.tileh, this.alpha, tile);
	}
};

Tileset.prototype.getMetatiles = function() {
	this.metatiles = [];
	var metatiles = getBinaryFile(metatiles_dir+this.id.toString().zfill(2) +  '_metatiles.bin');
	
	for (var metatile=0; metatile * this.metaw * this.metah < metatiles.length; metatile++) {
		var cur_metatile = new Uint8Array(this.metaw * this.metah);
		var tilestart = metatile * this.metaw * this.metah;
		for (var i = 0; i < cur_metatile.length; i++) {
			cur_metatile[i] = metatiles.charCodeAt(tilestart+i|0);
		}
		this.metatiles.push(cur_metatile);
	}
}

Tileset.prototype.getCollision = function() {
	this.collision = [];
	var coll = getBinaryFile(collision_dir+this.id.toString().zfill(2) + '_collision.bin');
	
	for (var i=0; i < coll.length; i++) {
		this.collision.push(coll.charCodeAt(i));
	}
}

Tileset.prototype.getPaletteMap = function() {
	this.palettemap = [];
	var palmap = getBinaryFile(palette_map_dir+(this.id).toString().zfill(2) + '_palette_map.bin');

	for (var i=0; i < palmap.length; i++) {
		var b = palmap.charCodeAt(i) & 0xff;
		
		this.palettemap.push(b & 0xf);
		this.palettemap.push(b >>> 4);
	}
}

Tileset.prototype.getPalettes = function() {
	// Todo: roof palettes
	this.palettes = getPalettes(palette_dir+'day.pal');
}



var Sprite = function(id, pic, x, y) {
	var selfS = this;

	this.id = id || 0;
	this.pic = pic || 0;
	this.x = x || 0;
	this.y = y || 0;
	this.lastx = this.x;
	this.lasty = this.y;

	this.img = new Image();
	this.img.id = 'sprite' + this.id;
	this.img.src = ow_dir + parseInt(this.pic).toString().zfill(3) + '.png';
	this.img.style.position = 'absolute';
	this.img.style.left = this.x + 'px';
	this.img.style.top  = this.y + 'px';

	this.palette = getPalettes(ow_dir + '000.pal')[0];

	this.img.onload = function() {
		selfS.canvas = canvas('sprite' + selfS.id, selfS.img.width, selfS.img.height);
		selfS.context = selfS.canvas.getContext('2d');
		selfS.image = flattenImageData(getRawImage(selfS.img), selfS.palette, selfS.canvas.width, selfS.canvas.height);
		selfS.draw();
		selfS.canvas.draggable = true;
		selfS.canvas.ondrag = function(e) {
			e.preventDefault();
			var rect = document.getElementById('window').getBoundingClientRect();
			var x = e.pageX - rect.left - window.scrollX - 8;
			var y = e.pageY - rect.top - window.scrollY - 8;
			if (x >= rect.width) {
				x = rect.width - selfS.canvas.width;
			} else if (x < 0) {
				x = 0;
			}
			if (y >= rect.height) {
				y = rect.height - selfS.canvas.height;
			} else if (y < 0) {
				y = 0;
			}
			x = Math.floor(x / selfS.canvas.width) * selfS.canvas.width;
			y = Math.floor(y / selfS.canvas.height) * selfS.canvas.height;
			selfS.x = x;
			selfS.y = y;
			selfS.draw();
			return false;
		};
	}
}

Sprite.prototype.draw = function() {
	this.canvas.style.position = 'absolute';
	this.canvas.style.left = this.x + 'px';
	this.canvas.style.top  = this.y + 'px';
	if (!document.getElementById(this.canvas.id)) {
		document.getElementById('window').appendChild(this.canvas);
	}
	this.context.putImageData(
		eraseWhite(this.image), 0, 0
	);
}


// image handling

function getPixel(img, x, y) {
	var i = (x + y * img.width) * 4;
	return [
		img.data[i  ]|0,
		img.data[i+1]|0,
		img.data[i+2]|0,
		img.data[i+3]|0
	];
}

function setPixel(img, x, y, pixel) {
	var i = (x + y * img.width) * 4;
	img.data[i  ] = pixel[0]|0;
	img.data[i+1] = pixel[1]|0;
	img.data[i+2] = pixel[2]|0;
	img.data[i+3] = pixel[3]|0;
}

function getRawImage(img) {
	var ctx = canvas('scratch', img.width, img.height).getContext('2d');
	ctx.drawImage(img, 0, 0);
	var imageData = ctx.getImageData(0, 0, img.width, img.height);
	return imageData;
}

function getImageTemplate(width, height) {
	var ctx = canvas('scratch', width, height).getContext('2d');
	return ctx.createImageData(width, height);
}

function getBase64Image(img) {
	var dataURL = canvas.toDataURL("image/png");
	return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

function canvas(id, width, height) {
	var c = document.createElement('canvas');
	c.id = id;
	c.width = width;
	c.height = height;
	return c;
}

function addCanvas(id, width, height) {
	var c = canvas(id, width, height);
	document.body.appendChild(c);
	return c;
}


// File handling uses XHR.

function getXHR() {
	var xhr;
	try {
		xhr = new XMLHttpRequest();
	} catch(e) {
		try {
			xhr = new ActiveXObject("MSXML2.XMLHTTP.6.0");
		} catch(e2) {
			try  {
				xhr = new ActiveXObject("MSXML2.XMLHTTP");
			} catch(e3) {}
		}
	}
	return xhr;
}

function loadTextFile(url, callback) {
	var xhr = getXHR();
	xhr.open('GET', url, !!callback);
	if (callback) {
		xhr.onload  = function(){callback(xhr, true)};
		xhr.onerror = function(){callback(xhr, false)};
	}
	xhr.send();
	return callback ? undefined : xhr.responseText;
}

function getBinaryFile(url, callback) {
	var xhr = getXHR();
	xhr.open('GET', url, !!callback);
	xhr.overrideMimeType('text/plain; charset=x-user-defined');
	if (callback) {
		xhr.onload  = function(){callback(xhr, true)};
		xhr.onerror = function(){callback(xhr, false)};
	}
	xhr.send();
	return callback ? undefined : xhr.responseText;
}

function saveFile(data) {
	window.location.href = 'data:application/octet-stream;base64,' + window.btoa(data);
}



function getPalettes(url) {
	var palettes = [];
	var pals = getBinaryFile(url);
	var num_colors = 4;
	var color_length = 2;
	var palette_length = num_colors * color_length;
	var num_pals = pals.length / palette_length;

	for (var p = 0; p < num_pals; p++) {
		palettes[p] = [];
		for (var c = 0; c < num_colors; c++) {
			var color = (
				(pals.charCodeAt(p * palette_length + c * color_length + 0) & 0xff) +
				((pals.charCodeAt(p * palette_length + c * color_length + 1) & 0xff) << 8)
			);
			palettes[p][c] = [
				(color >>> 0)  & 0x1f,
				(color >>> 5)  & 0x1f,
				(color >>> 10) & 0x1f
			];
		}
	}

	return palettes;
}

function flattenImageData(imageData, palette, width, height, alpha, tile) {
	// An imageData object is formatted with nested
	// pixel data, but we want flattened data.
	alpha = alpha || 255;
	tile = tile || 0;
	var image = getImageTemplate(width, height);
	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			var p = getPixel(
				imageData,
				width  * (tile % (imageData.width / width) | 0) + x,
				height * (tile / (imageData.width / width) | 0) + y
			);
			var i = (y * width + x) * 4;
			image.data[i+0] = palette[3 - p[0] / 85][0] * 8;
			image.data[i+1] = palette[3 - p[1] / 85][1] * 8;
			image.data[i+2] = palette[3 - p[2] / 85][2] * 8;
			image.data[i+3] = alpha | 0;
		}
	}
	return image;
}

function eraseWhite(image) {
	// Sprites use a certain shade of white for transparency.
	for (var i = 0; i < image.data.length / 4; i++) {
		var px = i * 4;
		if (
			image.data[px+0] === 216 &&
			image.data[px+1] === 248 &&
			image.data[px+2] === 216
		) {
			image.data[px+3] = 0 | 0;
		}
	}
	return image;
}



function listsToDict(keys, values) {
	var dict = {};
	for (var i = 0; i < keys.length; i++) {
		dict[keys[i]] = values[i];
	}
	return dict;
}


// asm parsing

function separateComment(line) {
	var in_quote = false;
	for (var i = 0; i < line.length; i++) {
		if (!in_quote) {
			if (line[i] === ';') {
				return [line.substr(0,i), line.substr(i)];
			}
		}
		if (line[i] === '"') in_quote = !in_quote;
	}
	return [line, undefined];
}

function asmAtLabel(asm, label) {
	var start = asm.indexOf(label + ':') + (label+':').length;
	var lines = asm.substr(start).split('\n');
	var content = [];
	for (var l = 0; l < lines.length; l++) {
		var line = lines[l];
		if (line.indexOf(':') !== -1) break;
		content.push(separateComment(line));
	}
	return content;
}


function macroValues(asm, macro) {
	var values = asm.substr(asm.indexOf(macro)+macro.length).split(',');
	for (var i = 0; i < values.length; i++) {
		values[i] = values[i].replace('$','0x').trim();
	}
	return values;
}

function dbValue(asm) {
	return asm.substr(asm.indexOf('db ')+3).replace('$','0x');
}

function dbValues(asm) {
	return macroValues(asm, 'db');
}



String.prototype.repeat = function(num) {
	return new Array(num + 1).join(this);
}

String.prototype.zfill = function(num) {
	return '0'.repeat(num - this.length) + this;
}

String.prototype.replaceCharCodeAt=function(index, code) {
	return this.substr(0, index) + String.fromCharCode(code) + this.substr(index+String.fromCharCode(code).length);
}

String.prototype.insertCharCodeAt=function(index, code) {
	return this.substr(0, index) + String.fromCharCode(code) + this.substr(index);
}

String.prototype.capWords = function() {
	return this.replace(/\w*/g, function(str) {
		return str.charAt(0).toUpperCase() + str.substr(1);
	});
}

