
blockdata_dir   = '../../maps/';
tiles_dir       = '../../gfx/tilesets/';
palette_dir     = '../../tilesets/';
metatiles_dir   = '../../tilesets/';
collision_dir   = '../../tilesets/';
palette_map_dir = '../../tilesets/';


// console tools
function fill(tile_id) {
	controller.painters[0].map.blockdata = '';
	for (i=0; i<controller.painters[0].map.width*controller.painters[0].map.height; i++) {
		controller.painters[0].map.blockdata += String.fromCharCode(tile_id|0);
	}
	controller.painters[0].map.draw();
}

function tileset(tileset_id) {
	var old_blk = controller.painters[0].map.blockdata;
	controller.painters[0] = new Painter(getCustomMap(controller.painters[0].map.id, controller.painters[0].map.width, controller.painters[0].map.height, tileset_id));
	controller.painters[0].map.blockdata = old_blk;
	controller.picker = new Picker(controller.painters[0].map);
}

function resize(width, height, filler_tile) {
	filler_tile = (filler_tile || 6) | 0;

	var last_width = controller.painters[0].map.width;
	var last_height = controller.painters[0].map.height;
	if (last_width === width && last_height === height) return;

	var blk = controller.painters[0].map.blockdata;

	if (last_width < width) {
		// append filler tiles to each row
		rows = []
		for (row=0;row<last_height;row++) {
			rows.push(blk.substr(last_width*row, last_width));
		}
		blk = ''
		for (r=0;r<rows.length;r++) {
			for (i=0;i<(width-last_width);i++) {
				rows[r] += String.fromCharCode(filler_tile);
			}
			blk += rows[r]
		}
	} else if (last_width > width) {
		// remove tiles from each row
		rows = []
		for (row=0;row<last_height;row++) {
			rows.push(blk.substr(last_width*row, width));
		}
		blk = ''
		for (r=0;r<rows.length;r++) {
			blk += rows[r]
		}
	}

	if (last_height < height) {
		// append filler rows to the bottom
		for (row=0;row<(height-last_height);row++) {
			for (i=0;i<width;i++) {
				blk += String.fromCharCode(filler_tile);
			}
		}
	} else if (last_height > height) {
		// remove rows from the bottom
		blk = blk.substr(0,width*height);
	}

	controller.painters[0] = new Painter(getCustomMap(controller.painters[0].map.id, width, height, controller.painters[0].map.tileset_id));
	controller.painters[0].map.blockdata = blk;
	controller.painters[0].map.draw();
}

function newblk(path) {
	var id = 0;
	var w = controller.painters[id].map.width;
	var h = controller.painters[id].map.height;
	var t = controller.painters[id].map.tileset_id;
	controller.painters[id] = new Painter(getCustomMap(id, w, h, t, path));
	controller.painters[id].map.draw();
}

function newmap(w,h) {
	w = w || 4;
	h = h || 4*256;
	var id = 0; //controller.painters.length || 0;
	controller.painters[id] = new Painter(getCustomMap(id, w, h));
	controller.picker = (new Picker(getCustomMap(id, w, h)));
}



function main() {
	init();
}

function init() {
	console.log('welcome to map editor');
	controller = new Controller();
	console.log('check out this rad map editor');
}

function updatePaintTile(painttile) {
	for (i=0; i < controller.painters.length; i++) {
		controller.painters[i].paint_tile = painttile || 0;
	}
}

var Controller = function() {
	this.painters = [];
	
	this.bar = document.createElement('div');
	this.bar.id = 'bar';
	
	this.newMapButton = document.createElement('div');
	this.newMapButton.innerHTML = '+';
	this.newMapButton.onclick = function(e) {
		var id = 0;
		if (!controller.painters[id] || window.confirm('Overwrite existing map?')) { newmap(); }
	};
	
	this.openButton = document.createElement('div');
	this.openButton.innerHTML = 'o';
	this.openButton.onclick = function(e) {
		if (!document.getElementById('opendialog')) {
			var openDialog = document.createElement('div');
			openDialog.id = 'opendialog';
			openDialog.innerHTML = '<form id="open"><p>BLK:<input id="blk" type="text" name="blk" value="" autocomplete="on"><br/>Tileset:<input id="tileset" type="text" name="tileset" maxlength="2" value="1" autocomplete="off"><br/>Width:<input id="width" type="text" name="width" maxlength="2" value="4" autocomplete="off"><br/>Height:<input id="height" type="text" name="height" maxlength="2" value="4" autocomplete="off"><br/><input id="submit" name="submit" type="submit" value="open"></p></form><form id="close"><input id="close" name="close" type="submit" value="OK"></form>';
			openDialog.className = 'dialog';
			document.body.appendChild(openDialog);
			document.forms['open'].onsubmit = function(e) {
				e.preventDefault();
				console.log('opened', document.forms['open']['blk'].value);
				var id = 0; //controller.painters.length || 0;

				controller.painters[id] = new Painter(getCustomMap(id, document.forms['open']['width'].value, document.forms['open']['height'].value, document.forms['open']['tileset'].value, document.forms['open']['blk'].value));
				controller.picker = new Picker(getCustomMap(id, document.forms['open']['width'].value, document.forms['open']['height'].value, document.forms['open']['tileset'].value, document.forms['open']['blk'].value));
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
	this.saveButton.innerHTML = 's';
	this.saveButton.onclick = function(e) {
		var blk = controller.painters[0].map.blockdata;
		window.location.href = 'data:application/octet-stream;base64,' + window.btoa(blk);
	};
	
	this.pickerTileForm = document.createElement('div');
	this.pickerTileForm.innerHTML = '<form id="ptile"><input id="ptilei" type="text" name="ptile" maxlength="3" value="1" autocomplete="off"></form>';
	this.pickerTileForm.onsubmit = function(e) {
		updatePaintTile(document.forms['ptile']['ptilei'].value);
		return false;
	};
	
	this.pickerView = document.createElement('div');
	this.pickerView.id = 'picker';
	this.pickerView.addEventListener('mousewheel', function(e) {
		this.scrollLeft -= (e.wheelDelta);
		e.preventDefault();
	}, false);
	
	this.divs = [this.newMapButton, this.openButton, this.saveButton, this.pickerTileForm, this.pickerView]
	for (i=0; i<this.divs.length; i++) {
		this.divs[i].className = 'barchild';
		this.bar.appendChild(this.divs[i]);
	}
	document.body.appendChild(this.bar);
	
	this.window = document.createElement('div');
	this.window.id = 'window';
	this.window.style.height = window.innerHeight - 80 + 'px';
	document.body.appendChild(this.window);
	
	return this;
}

var Picker = function(pmap) {
	var selfK = this;

	var blockdata = '';
	for (i=0; i<(pmap.tileset.metatiles.length); i++) {
		blockdata += String.fromCharCode(i);
	}
	var h = 4;
	var w = blockdata.length / h;

	selfK.map = new Map('pickerc', pmap.group, pmap.num, w, h, pmap.tileset_id);
	selfK.map.blockdata = blockdata;

	selfK.map.canvas.onclick = function(e) {
		var pickx = Math.floor(
			(e.pageX - selfK.map.canvas.getBoundingClientRect().left - window.scrollX)/(selfK.map.tileset.tilew*selfK.map.tileset.metaw),
			selfK.map.tileset.tilew
		);
		var picky = Math.floor(
			(e.pageY - selfK.map.canvas.getBoundingClientRect().top - window.scrollY)/(selfK.map.tileset.tileh*selfK.map.tileset.metah),
			selfK.map.tileset.tileh
		);
		document.forms['ptile']['ptilei'].value = picky*selfK.map.width + pickx;
		updatePaintTile(document.forms['ptile']['ptilei'].value);
	};

	controller.pickerView.innerHTML = '';
	controller.pickerView.appendChild(selfK.map.canvas);
}

var Painter = function(pmap) {
	
	this.map = pmap;
	controller.window.style.width = this.map.canvas.width + 'px';
	controller.window.style.height = this.map.canvas.height + 'px';
	controller.window.innerHTML = '';
	controller.window.appendChild(this.map.canvas);
	controller.pickerView.style.top = '9px';
	
	// tile paint
	
	this.paint_tile = 1;
	this.paintx = undefined;
	this.painty = undefined;
	this.lastx = undefined;
	this.lasty = undefined;
	
	checkPaint = function(e) {
		var selfP = controller.painters[e.target.id];
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
			console.log('paint at ' + selfP.paintx + ', ' + selfP.painty + ': ' + selfP.lasttile + ' -> ' + selfP.newtile);
		}
	}
	
	function resetPaint(e) {
		var selfP = controller.painters[e.target.id];
		selfP.paintint = setInterval(function(){checkPaint(e);}, 5);
	}
	
	function stopPaint(e) {
		var selfP = controller.painters[e.target.id];
		clearInterval(selfP.paintint);
		selfP.map.draw();
	}
	
	this.map.canvas.onmousedown   = function(e) { stopPaint(e); resetPaint(e); e.preventDefault(); }
	this.map.canvas.onmouseup     = function(e) { stopPaint(e); }
	this.map.canvas.onmouseout    = function(e) { stopPaint(e); }
	this.map.canvas.oncontextmenu = function(e) { stopPaint(e); }
	
	this.map.canvas.onmousemove = function(e) {
		var selfP = controller.painters[e.target.id];
		try {
			selfP.map.drawMetatile(
				selfP.map.blockdata.charCodeAt(selfP.lasty*selfP.map.width+selfP.lastx),
				selfP.lastx, selfP.lasty, selfP.map.tileset
			);
		} catch(err) { };
		
		selfP.lastx = Math.floor(
			(e.pageX - selfP.map.canvas.getBoundingClientRect().left - window.scrollX)/(selfP.map.highlight.tilew*selfP.map.highlight.metaw),
			selfP.map.highlight.tilew
		);
		selfP.lasty = Math.floor(
			(e.pageY - selfP.map.canvas.getBoundingClientRect().top - window.scrollY)/(selfP.map.highlight.tileh*selfP.map.highlight.metah),
			selfP.map.highlight.tileh
		);
		selfP.map.drawMetatile(
			selfP.map.blockdata.charCodeAt(selfP.lasty*selfP.map.width+selfP.lastx),
			selfP.lastx, selfP.lasty, selfP.map.highlight
		);
	}
	return this;
}


// old painter proto
/*
var Painter = function(pmap) {
	
	// tile paint
	var selfP = this;
	
	this.paint_tile = 1;
	this.paintx = undefined;
	this.painty = undefined;
	this.lastx = undefined;
	this.lasty = undefined;
	this.paintedthisclick = false;
	
	checkPaint = function() {
		if ((selfP.paintx !== selfP.lastx) | (selfP.painty !== selfP.lasty) | (selfP.paintedthisclick === false)) {
			selfP.paintedthisclick = true;
			selfP.paintx = selfP.lastx;
			selfP.painty = selfP.lasty;
			var lasttile = pmap.blockdata.charCodeAt(selfP.painty*pmap.width+selfP.paintx);
			pmap.blockdata = pmap.blockdata.replaceCharCodeAt(selfP.painty*pmap.width+selfP.paintx, selfP.paint_tile);
			pmap.drawMetatile(
				pmap.blockdata.charCodeAt(selfP.painty*pmap.width+selfP.paintx),
				selfP.paintx, selfP.painty, pmap.highlight
			);
			var newtile = pmap.blockdata.charCodeAt(selfP.painty*pmap.width+selfP.paintx);
			console.log('paint at ' + selfP.paintx + ', ' + selfP.painty + ': ' + lasttile + ' -> ' + newtile);
		}
	}
	
	function resetPaint() {
		selfP.paintint = setInterval(checkPaint, 16);
		selfP.paintedthisclick = false;
		selfP.mousedown = true;
	}
	
	function stopPaint() {
		clearInterval(selfP.paintint);
		selfP.mousedown = false;
		try {
			pmap.drawMetatile(
				pmap.blockdata.charCodeAt(selfP.lasty*pmap.width+selfP.lastx),
				selfP.lastx, selfP.lasty, pmap.tileset
			);
		} catch(e) {};
	}
	
	pmap.canvas.onmousedown   = function(e) { resetPaint(); }
	pmap.canvas.onmouseup     = function(e) { stopPaint();  }
	pmap.canvas.onmouseout    = function(e) { stopPaint();  }
	pmap.canvas.oncontextmenu = function(e) { stopPaint();  }
	
	pmap.canvas.onmousemove = function(e) {
		try {
			pmap.drawMetatile(
				pmap.blockdata.charCodeAt(selfP.lasty*pmap.width+selfP.lastx),
				selfP.lastx, selfP.lasty, pmap.tileset
			);
		} catch(e) {};
		
		selfP.lastx = Math.floor(
			(e.pageX - pmap.canvas.offsetLeft)/(pmap.highlight.tilew*pmap.highlight.metaw),
			pmap.highlight.tilew
		);
		selfP.lasty = Math.floor(
			(e.pageY - pmap.canvas.offsetTop)/(pmap.highlight.tileh*pmap.highlight.metah),
			pmap.highlight.tileh
		);
		pmap.drawMetatile(
			pmap.blockdata.charCodeAt(selfP.lasty*pmap.width+selfP.lastx),
			selfP.lastx, selfP.lasty, pmap.highlight
		);
	}
	return this;
}
*/


function getMapById(id, group, num) {
	return new Map(id, group, num);
}

function getCustomMap(id, width, height, tileset_id, blockfile) {
	return new Map(id, undefined, undefined, width, height, tileset_id, blockfile);
}

var Map = function(id, group, num, width, height, tileset_id, blockfile) {
	this.id    = id || 0;
	this.group = group;
	this.num   = num;

	if (this.group !== undefined || this.num !== undefined) {
		this.tileset_id = tileset_id || map_names[this.group][this.num]['header_old']['tileset'];
	} else {
		this.tileset_id = tileset_id || 1;
	}

	this.tileset   = new Tileset(this.tileset_id);
	var selfM = this;
	selfM.tileset.img.onload = function() {
		selfM.tileset.getTileData();
		selfM.draw();
		controller.window.style.left = '0px';
	}

	this.highlight = new Tileset(this.tileset_id, 255);
	
	this.width  = width  || map_names[this.group][this.num]['header_old']['second_map_header']['width'];
	this.height = height || map_names[this.group][this.num]['header_old']['second_map_header']['height'];
	
	this.canvas  = canvas(
		this.id,
		this.width  * this.tileset.tilew * this.tileset.metaw,
		this.height * this.tileset.tileh * this.tileset.metah
	);
	this.context = this.canvas.getContext('2d');
	
	this.blockfile = blockfile;
	this.blockdata = '';

	if (((this.group === undefined) || (this.num === undefined)) && this.blockfile === undefined) {
		this.newBlockData();
	} else {
		this.getBlockData();
	}
	
	return this;
};

Map.prototype.draw = function() {
	if (this.tileset.img.complete) {
		for (y=0; y<this.height; y++) {
			for (x=0; x<this.width; x++) {
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
	var pw = tset.metaw*tset.tilew*tx;
	var ph = tset.metah*tset.tileh*ty;
	for (dy=0; dy<tset.metah; dy++) {
		for (dx=0; dx<tset.metaw; dx++) {
			cur_tile = tset.metatiles[id][dy*tset.metaw+dx];
			// Tile gfx are split in half to make VRAM mapping easier.
			cur_tile = cur_tile >= 0xa0 ? cur_tile - 0x20 : cur_tile;
			this.context.putImageData((tset.tiles[cur_tile][1]), pw+dx*tset.tilew, ph+dy*tset.tileh);
		}
	}
}

Map.prototype.getBlockData = function() {
	filename = this.blockfile ||
		blockdata_dir+
		(map_names[this.group][this.num]['label']||map_names[this.group][this.num]['name'])
		.replace(/\s+/g, '')
		.replace('é','e')
		.replace('\'','')+
		'.blk'
	;
	console.log(filename);
	this.blockdata = getBinaryFile(filename);
}

Map.prototype.newBlockData = function() {
	this.blockdata = '';
	for (i=0; i<this.width*this.height; i++) {
		this.blockdata += String.fromCharCode(6|0);
	}
}


var Tileset = function(id, alpha, tilew, tileh, metaw, metah, collw, collh) {
	this.id         = id    || 0;
	this.tilew      = tilew || 8;
	this.tileh      = tileh || 8;
	this.alpha      = alpha || 192;
	
	this.metaw      = metaw || 1;
	this.metah      = metah || 1;
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
	var imageData = getRawImage(this.img);
	
	for (tile=0; tile<(imageData.width*imageData.height)/(this.tilew*this.tileh); tile++) {
		this.tiles[tile] = [];
		
		// Palette maps are padded to make vram mapping easier.
		pal = this.palettemap[tile>=0x60?tile+0x20:tile]&0x7;
		
		// An imageData object is formatted with nested pixel data...
		this.tiles[tile][0] = [];
		for (y=0; y < this.tileh; y++) {
			for (x=0; x < this.tilew; x++) {
				this.tiles[tile][0].push(
					getPixel( imageData,
					          this.tilew*(tile % (imageData.width/this.tilew)|0) + x,
					          this.tileh*(tile / (imageData.width/this.tilew)|0) + y  )
				);
			}
		}
		
		// ...but we want flattened data.
		tileData = getImageTemplate(this.tilew, this.tileh);
		for (i=0; i < this.tiles[tile][0].length; i++) {
			px = i*4;
			
			// color
			tileData.data[px  ] = this.palettes[pal][3-this.tiles[tile][0][i][0]/85][0]*8;
			tileData.data[px+1] = this.palettes[pal][3-this.tiles[tile][0][i][1]/85][1]*8;
			tileData.data[px+2] = this.palettes[pal][3-this.tiles[tile][0][i][2]/85][2]*8;
			
			/*
			// monochrome
			tileData.data[px  ] = this.tiles[tile][0][i][0]|0;
			tileData.data[px+1] = this.tiles[tile][0][i][1]|0;
			tileData.data[px+2] = this.tiles[tile][0][i][2]|0;
			*/
			
			tileData.data[px+3] = this.alpha|0;
		}
		
		// Keep both for posterity.
		this.tiles[tile][1] = tileData;
	}
};

Tileset.prototype.getMetatiles = function() {
	this.metatiles = [];
	//var metatiles = getBinaryFile(metatiles_dir+this.id.toString().zfill(2) +  '_metatiles.bin');
	var metatiles = '';
	for (i=0; i<(224); i++) {
		metatiles += String.fromCharCode(i);
	}
	for (metatile=0;metatile*this.metaw*this.metah<metatiles.length;metatile++) {
		cur_metatile = new Uint8Array(this.metaw*this.metah);
		tilestart = metatile*this.metaw*this.metah;
		for (i=0;i<cur_metatile.length;i++) {
			cur_metatile[i] = metatiles.charCodeAt(tilestart+i|0);
		}
		this.metatiles.push(cur_metatile);
	}
}

Tileset.prototype.getCollision = function() {
	this.collision = [];
	var coll = getBinaryFile(collision_dir+this.id.toString().zfill(2) + '_collision.bin');
	
	for (i=0;i<coll.length;i++) {
		this.collision.push(coll.charCodeAt(i));
	}
}

Tileset.prototype.getPaletteMap = function() {
	this.palettemap = [];
	var palmap = getBinaryFile(palette_map_dir+(this.id).toString().zfill(2) + '_palette_map.bin');

	for (i=0;i<palmap.length;i++) {
		b = palmap.charCodeAt(i) & 0xff;
		
		this.palettemap.push(b & 0xf);
		this.palettemap.push(b >>> 4);
	}
}

Tileset.prototype.getPalettes = function() {
	// Todo: roof palettes
	this.palettes = [];
	var pals = getBinaryFile(palette_dir+'day.pal');
	
	for (i=0;i<pals.length/8;i+=1) {
		this.palettes[i] = [];
		for (j=0;j<4;j++) {
			var color = (pals.charCodeAt(i*8+j*2)&0xff) + ((pals.charCodeAt(i*8+j*2+1)<<8)&0xff00);
			this.palettes[i][j] = [
				(color >>> 0)  & 0x1f,
				(color >>> 5)  & 0x1f,
				(color >>> 10) & 0x1f
			];
		}
	}
}


// image handling

function getPixel(img, x, y) {
	i = (x + y*img.width) * 4;
	return [
		img.data[i  ]|0,
		img.data[i+1]|0,
		img.data[i+2]|0,
		img.data[i+3]|0
	];
}

function setPixel(img, x, y, pixel) {
	i = (x + y*img.width) * 4;
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


// binary handling

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

function getBinaryFile(url, callback) {
	var xhr = getXHR();
	xhr.open("GET", url, !!callback);
	xhr.overrideMimeType("text/plain; charset=x-user-defined");
	if (callback) {
		xhr.onload = function(){callback(xhr, true)};
		xhr.onerror = function(){callback(xhr, false)};
	}
	xhr.send();
	return callback ? undefined : xhr.responseText;
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

