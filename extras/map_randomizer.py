# coding: utf-8

import sys
import random
import math


collisions = {
	'walk': 0x00,
	'wall': 0x07,
}

class RandomizedMap(object):
	
	"""Converts clustered node paths from a collision map to coherent blockdata.
\	
\	Usage:
\		rmap = RandomizedMap()
\		rmap.generate()
"""
	
	def __init__(self, width=20, height=20, tileset=2):
		
		self.debug   = True
		
		self.width   = width
		self.height  = height
		
		self.tileset = tileset
		self.metatile_width  = 2
		self.metatile_height = 2
		
		self.collision_types = {}
		
		self.variation  = 1
		self.num_nodes  = 20
		self.nodes      = []
		
		self.exits      = ['left', 'right', 'up', 'down']
		self.exit_nodes = []
		
		self.paths      = []
		
		self.collision_map = bytearray([collisions['wall']] * self.collision_width * self.collision_height)
		
		self.blockdata = bytearray([0x00] * self.width * self.height)
	
	@property
	def movements(self):
		return {
			'up':   -self.collision_width,
			'down':  self.collision_width,
			'left': -1,
			'right': 1,
		}
	
	@property
	def collision_width(self):
		return self.width * self.metatile_width
	@property
	def collision_height(self):
		return self.height * self.metatile_height
	@property
	def collision_filename(self):
		return '../tilesets/%0.2d_collision.bin' % self.tileset
	
	
	def generate(self):
		self.create_nodes()
		self.make_exit_nodes()
		self.path_nodes()
		self.tile_paths()
		if self.debug:
			print 'collision map:'
			print self.text_map(self.collision_map, self.collision_width)
		self.collision_to_blockdata()
	
	
	def text_map(self, blk=None, width=None):
		
		"""Creates a simplified hex map of the map's blockdata."""
		
		if blk == None: blk = self.blockdata
		if width == None: width = self.width
		
		output = ''
		for y in range(len(blk)/width):
			for x in range(width):
				output += hex(blk[width*y+x])[2:].zfill(2).replace('00','..') + ' '
			output += '\n'
		return output
	
	
	def get_collision_types(self):
		
		"""Grabs the collision types represented in the map's tileset."""
		
		self.collision_types = {}
		
		with open(self.collision_filename, 'rb') as filein:
			self.collision_data = bytearray(filein.read())
		
		for metatile in range(1,len(self.collision_data)/(self.metatile_width * self.metatile_height)):
			#             ^ tile 0 is worthless
			
			start = metatile * self.metatile_width * self.metatile_height
			
			cur_coll = tuple(self.collision_data[start:start + self.metatile_width * self.metatile_height])
			
			if cur_coll not in self.collision_types.keys():
				self.collision_types.update(**{cur_coll:[]})
			self.collision_types[cur_coll] += [metatile]
		
		if self.debug:
			print 'collision types:'
			print self.collision_types
	
	
	def create_nodes(self):
		
		"""Generates random nodes across the collision map."""
		
		self.nodes = []
		for node in range(1,self.num_nodes+1):
			x = 0
			while x % self.collision_width  in [self.collision_width  - 1, 0]:
				x = int(self.collision_width  * random.uniform(.2/self.variation,1-.2/self.variation) * self.collision_width  * node/(self.num_nodes+1)) % self.collision_width
			y = 0
			while y % self.collision_height in [self.collision_height - 1, 0]:
				y = int(self.collision_height * random.uniform(.2/self.variation,1-.2/self.variation) * self.collision_height * node/(self.num_nodes+1)) % self.collision_height
			self.nodes.append((x, y))
	
	
	def make_exit_nodes(self):
		
		"""Generates nodes for each exit on the collision map (including repeats)."""
		
		self.exit_nodes = []
		for exit in self.exits:
			self.exit_nodes += [{
				'left':  (0,                      int(random.uniform(.2*self.collision_height,.8*self.collision_height))),
				'right': (self.collision_width-1, int(random.uniform(.2*self.collision_height,.8*self.collision_height))),
				'up':    (int(random.uniform(.2*self.collision_width,.8*self.collision_width)),                        0),
				'down':  (int(random.uniform(.2*self.collision_width,.8*self.collision_width)),  self.collision_height-1),
			}[exit]]


	def cluster_nodes(self, nodes, cluster_size=3):
		
		"""Connects nodes nearest to each other into clusters."""
		
		clusters = []
		for node1 in nodes:
			disps = []
			#used_nodes.append(node1)
			for i, vector in enumerate( zip([abs(node2[0] - node1[0]) for node2 in nodes], [abs(node2[1] - node1[1]) for node2 in nodes]) ):
				if vector[0] == 0 and vector[1] == 0: # same node
					continue
				displacement = math.sqrt(vector[0]**2 + vector[1]**2)
				disps.append([displacement, nodes[i]])
		
			# doesn't discriminate by distance yet
			clusters.append([node1, sorted(disps)[:cluster_size]])
		
		return clusters
	
	
	def path_clusters(self, clusters):
		for from_node, branches in clusters:
			for displacement, to_node in branches:
				self.paths.append([from_node, to_node])
	
	def path_nodes(self):
		
		"""Creates vectors to connect node clusters."""
		
		nodes = self.nodes + self.exit_nodes
		
		self.paths = []
		
		# path each cluster
		clusters = self.cluster_nodes(nodes, 5)
		self.path_clusters(clusters)
		
		# cluster the clusters
		superclusters = self.cluster_nodes([from_node for from_node, branches in clusters], 5)
		self.path_clusters(superclusters)
		
		# cluster the superclusters (this should be recursive)
		ultraclusters = self.cluster_nodes([from_node for from_node, branches in superclusters], 5)
		self.path_clusters(ultraclusters)
	
	
	def tile_paths(self):
	
		"""Turns vector paths into tile movements."""
	
		for [fromx, fromy], [tox, toy] in self.paths:
			rise  = toy - fromy
			run   = tox - fromx
			
			tile = self.collision_width * fromy + fromx
			self.collision_map[tile] = collisions['walk']
			
			rise_step = self.movements['up'   if rise < 0 else 'down' ]
			run_step  = self.movements['left' if run  < 0 else 'right']
			
			if rise == 0 and run == 0: pass
			
			elif run == 0:
				for step in range(rise):
					tile += rise_step
					self.collision_map[tile] = collisions['walk']
			
			elif rise == 0:
				for step in range(run):
					tile += run_step
					self.collision_map[tile] = collisions['walk']
			
			else:
				if abs(run) > abs(rise):
					primary = run
					primary_step = run_step
					secondary = rise
					secondary_step = rise_step
				
				else: # rise > run
					primary = rise
					primary_step = rise_step
					secondary = run
					secondary_step = run_step
				
				remainder = primary % secondary
				ratio = int(math.floor(primary/secondary))
			
				for step in range(int((primary - remainder) / ratio)):
					
					for up in range(ratio):
						tile += primary_step
						self.collision_map[tile] = collisions['walk']
				
					tile += secondary_step
					self.collision_map[tile] = collisions['walk']
				
				for step in range(remainder):
					
					tile += primary_step
					self.collision_map[tile] = collisions['walk']
	
	
	def collision_to_blockdata(self):
		
		"""Converts a collision map into valid blockdata."""
		
		self.get_collision_types()
		
		for y in range(0, self.collision_height, self.metatile_height):
			for x in range(0, self.collision_width, self.metatile_width):
				i = self.collision_width * y + x
				block_coll = (
					self.collision_map[i],
					self.collision_map[i+1],
					self.collision_map[i + self.collision_width],
					self.collision_map[i + self.collision_width + 1]
				)
				metatile = int(math.floor(random.random() * len(self.collision_types[block_coll]))) # todo: don't randomize this
				self.blockdata[int((y/self.metatile_height) * (self.collision_width/self.metatile_width) + (x/self.metatile_width))] = self.collision_types[block_coll][metatile]
		
		if self.debug:
			print 'blockdata:'
			print self.text_map()
	
	
	def export_blockdata(self, filename):
		with open(filename, 'wb') as fileout:
			fileout.write(self.blockdata)


rmap = RandomizedMap()
rmap.generate()

