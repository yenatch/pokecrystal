
blockdata_dir   = '../../maps/';
tiles_dir       = '../../gfx/tilesets/';
palette_dir     = '../../tilesets/';
metatiles_dir   = '../../tilesets/';
collision_dir   = '../../tilesets/';
palette_map_dir = '../../tilesets/';

function main() {
	init();
}

function init() {
	
	console.log('welcome to map editor');
	
	controller = new Controller();
	
	console.log('check out this rad map editor');
	
}

var Controller = function() {
	this.painters = [];
	
	this.bar = document.createElement('div');
	this.bar.id = 'bar';
	
	this.divs = [];
	
	this.divs[0] = document.createElement('div');
	this.divs[0].id = 'barchild';
	this.divs[0].innerHTML = '+';
	
	this.divs[0].onclick = function(e) {
		var id = controller.painters.length || 0;
		controller.painters[id] = new Painter(new Map(id, 1, id+1));
		setTimeout('\
			var id = '+id+';\
			if (controller.painters[id].map.tileset.img.complete) {\
				controller.painters[id].map.draw();\
			}\
		', 15);
	};
	
	this.divs[1] = document.createElement('div');
	this.divs[1].id = 'barchild';
	this.divs[1].innerHTML = '<form id="ptile"><input id="ptilei" type="text" name="ptile" maxlength="3" value="1" autocomplete="off"></form>';
	this.divs[1].onsubmit = function(e) {
		for (i=0; i < controller.painters.length; i++) {
			controller.painters[i].paint_tile = document.forms['ptile']['ptile'].value || 1;
		}
		return false;
	};
	
	for (i=0; i<this.divs.length; i++) {
		this.bar.appendChild(this.divs[i]);
	}
	document.body.appendChild(this.bar);
	
	return this;
}

var Painter = function(pmap) {
	
	this.map = pmap;
	
	// tile paint
	
	this.paint_tile = 1;
	this.paintx = undefined;
	this.painty = undefined;
	this.lastx = undefined;
	this.lasty = undefined;
	this.paintedthisclick = false;
	
	checkPaint = function(e) {
		var selfP = controller.painters[e.target.id];
		if ((selfP.paintx !== selfP.lastx) | (selfP.painty !== selfP.lasty) | (selfP.paintedthisclick === false)) {
			selfP.paintedthisclick = true;
			selfP.paintx = selfP.lastx;
			selfP.painty = selfP.lasty;
			selfP.lasttile = selfP.map.blockdata.charCodeAt(selfP.painty*selfP.map.width+selfP.paintx);
			selfP.map.blockdata = selfP.map.blockdata.replaceCharCodeAt(selfP.painty*selfP.map.width+selfP.paintx, selfP.paint_tile);
			selfP.map.drawMetatile(
				selfP.map.blockdata.charCodeAt(selfP.painty*selfP.map.width+selfP.paintx),
				selfP.paintx, selfP.painty, selfP.map.highlight
			);
			selfP.newtile = selfP.map.blockdata.charCodeAt(selfP.painty*selfP.map.width+selfP.paintx);
			console.log('paint at ' + selfP.paintx + ', ' + selfP.painty + ': ' + selfP.lasttile + ' -> ' + selfP.newtile);
		}
	}
	
	function resetPaint(e) {
		this.paintint = setInterval(function(){checkPaint(e);}, 16);
		this.paintedthisclick = false;
		this.mousedown = true;
	}
	
	function stopPaint(e) {
		clearInterval(this.paintint);
		this.mousedown = false;
		try {
			this.map.drawMetatile(
				this.map.blockdata.charCodeAt(this.lasty*this.map.width+this.lastx),
				this.lastx, this.lasty, this.map.tileset
			);
		} catch(err) { };
	}
	
	this.map.canvas.onmousedown   = function(e) { resetPaint(e); }
	this.map.canvas.onmouseup     = function(e) { stopPaint(e);  }
	this.map.canvas.onmouseout    = function(e) { stopPaint(e);  }
	this.map.canvas.oncontextmenu = function(e) { stopPaint(e);  }
	
	this.map.canvas.onmousemove = function(e) {
		var selfP = controller.painters[e.target.id];
		try {
			selfP.map.drawMetatile(
				selfP.map.blockdata.charCodeAt(selfP.lasty*selfP.map.width+selfP.lastx),
				selfP.lastx, selfP.lasty, selfP.map.tileset
			);
		} catch(err) { };
		
		selfP.lastx = Math.floor(
			(e.pageX - selfP.map.canvas.offsetLeft)/(selfP.map.highlight.tilew*selfP.map.highlight.metaw),
			selfP.map.highlight.tilew
		);
		selfP.lasty = Math.floor(
			(e.pageY - selfP.map.canvas.offsetTop)/(selfP.map.highlight.tileh*selfP.map.highlight.metah),
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



var Map = function(id, group, num) {
	this.id      = id    || 0;
	this.group   = group || 1;
	this.num     = num   || 1;
	
	this.tileset = new Tileset(map_names[group][num]['header_old']['tileset']);
	this.highlight = new Tileset(map_names[group][num]['header_old']['tileset'],undefined,undefined,undefined,undefined,undefined,undefined,255);
	
	this.width   = map_names[group][num]['header_old']['second_map_header']['width'];
	this.height  = map_names[group][num]['header_old']['second_map_header']['height'];
	
	this.cwidth  = this.width  * this.tileset.tilew * this.tileset.metaw;
	this.cheight = this.height * this.tileset.tileh * this.tileset.metah;
	this.canvas  = addCanvas(this.id, this.cwidth, this.cheight);
	this.context = this.canvas.getContext('2d');
	
	this.getBlockData();
	
	return this;
};

Map.prototype.draw = function() {
	for (y=0; y<this.height; y++) {
		for (x=0; x<this.width; x++) {
			this.drawMetatile(
				this.blockdata.charCodeAt(y*this.width+x),
				x, y
			);
		}
	}
};

Map.prototype.drawMetatile = function(id, tx, ty, tset) {
	tset = tset || this.tileset;
	pw = tset.metaw*tset.tilew*tx;
	ph = tset.metah*tset.tileh*ty;
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
	filename =
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


var Tileset = function(id, tilew, tileh, metaw, metah, collw, collh, alpha) {
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
	
	this.img        = new Image();
	this.img.src    = tiles_dir + this.id.toString().zfill(2) + '.png';
	
	this.getPalettes();
	this.getPaletteMap();
	this.getTileData();
	this.getMetatiles();
	
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
	var metatiles = getBinaryFile(metatiles_dir+this.id.toString().zfill(2) +  '_metatiles.bin');
	
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

