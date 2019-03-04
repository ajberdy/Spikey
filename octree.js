const octree_size=10000

const octree_coord=-50


function myOctree(position, size, accuracy) {
  this.maxDistance = Math.max(size.x, Math.max(size.y, size.z));
  this.accuracy = 0;
  this.root = new myOctree.Cell(this, position, size, 0);
  this.points_collection = [];
}

myOctree.prototype.collide_entities = function(entities, collision_function) {
    for (var x = 1; x < entities.length; ++x) {

        this.temp_collision = this.point_search(entities[x].pos, 80, true).points;
        for (var k = 0; k < this.temp_collision.length; ++k) {

            this.check = this.temp_collision[k].dot(this.temp_collision[k]) + 
                         this.temp_collision[k][0]*this.temp_collision[k][1] + 
                         this.temp_collision[k][0]*this.temp_collision[k][2] +
                         this.temp_collision[k][2]*this.temp_collision[k][1];

            this.index = this.points_collection.indexOf(this.check);

            collision_function(entities[x], entities[this.index]);

        }

    }
}

myOctree.prototype.initialize = function(entities) {
    var points_collection=[];

    for (var e = 0; e < entities.length; ++e) {
       this.add(entities[e].pos);
       this.points_collection.push(entities[e].pos.dot(entities[e].pos) +
                                   entities[e].pos[0]*entities[e].pos[1] +
                                   entities[e].pos[0]*entities[e].pos[2] +
                                   entities[e].pos[2]*entities[e].pos[1]);
    }
}

myOctree.MaxLevel = 8;

myOctree.prototype.add = function (p, data) {
  this.root.add(p, data);
};

myOctree.prototype.is_part_of = function (x) {
  return this.root.is_part_of(x);
};

myOctree.prototype.point_search = function (p, r, options) {
  options = options || { };
  var result = { points: [], data: [] };
  this.root.point_search(p, r, result, options);
  return result;
};

myOctree.prototype.level = function (cell, level, result) {
  if (typeof level == 'undefined') {
    level = cell;
    cell = this.root;
  }
  result = result || [];
  if (cell.level == level) {
    if (cell.points.length > 0) {
      result.push(cell);
    }
    return result;
  } else {
    cell.children.forEach(function (child) {
      this.level(child, level, result);
    }.bind(this));
    return result;
  }
};


myOctree.Cell = function (tree, position, size, level) {
  this.tree = tree;
  this.position = position;
  this.size = size;
  this.level = level;
  this.points = [];
  this.data = [];
//   this.temp = new Vec3(); //temp vector for distance calculation
  this.children = [];
};

myOctree.Cell.prototype.is_part_of = function (p) {
  if (!this.contains(p))
    return null;
  if (this.children.length > 0) {
    for (var i = 0; i < this.children.length; i++) {
      var duplicate = this.children[i].is_part_of(p);
      if (duplicate) {
        return duplicate;
      }
    }
    return null;
  } else {
    var minDistSqrt = this.tree.accuracy * this.tree.accuracy;
    for (var i = 0; i < this.points.length; i++) {
      var o = this.points[i];
      var distSq = p.squareDistance(o);
      if (distSq <= minDistSqrt) {
        return o;
      }
    }
    return null;
  }
};

myOctree.Cell.prototype.add = function (p, data) {
  this.points.push(p);
  this.data.push(data);
  if (this.children.length > 0) {
    this.addToChildren(p, data);
  } else {
    if (this.points.length > 1 && this.level < myOctree.MaxLevel) {
      this.split();
    }
  }
};

myOctree.Cell.prototype.addToChildren = function (p, data) {
  for (var i = 0; i < this.children.length; i++) {
    if (this.children[i].contains(p)) {
      this.children[i].add(p, data);
      break;
    }
  }
};

myOctree.Cell.prototype.contains = function (p) {
  return p[0] >= this.position[0] - this.tree.accuracy
      && p[1] >= this.position[1] - this.tree.accuracy
      && p[2] >= this.position[2] - this.tree.accuracy
      && p[0] < this.position[0] + this.size[0] + this.tree.accuracy
      && p[1] < this.position[1] + this.size[1] + this.tree.accuracy
      && p[2] < this.position[2] + this.size[2] + this.tree.accuracy;
};


myOctree.Cell.prototype.split = function () {
  var x = this.position[0];
  var y = this.position[1];
  var z = this.position[2];
  var w2 = this.size[0] / 2;
  var h2 = this.size[1] / 2;
  var d2 = this.size[2] / 2;
  this.children.push(new myOctree.Cell(this.tree, Vec.of(x, y, z), Vec.of(w2, h2, d2), this.level + 1));
  this.children.push(new myOctree.Cell(this.tree, Vec.of(x + w2, y, z), Vec.of(w2, h2, d2), this.level + 1));
  this.children.push(new myOctree.Cell(this.tree, Vec.of(x, y, z + d2), Vec.of(w2, h2, d2), this.level + 1));
  this.children.push(new myOctree.Cell(this.tree, Vec.of(x + w2, y, z + d2), Vec.of(w2, h2, d2), this.level + 1));
  this.children.push(new myOctree.Cell(this.tree, Vec.of(x, y + h2, z), Vec.of(w2, h2, d2), this.level + 1));
  this.children.push(new myOctree.Cell(this.tree, Vec.of(x + w2, y + h2, z), Vec.of(w2, h2, d2), this.level + 1));
  this.children.push(new myOctree.Cell(this.tree, Vec.of(x, y + h2, z + d2), Vec.of(w2, h2, d2), this.level + 1));
  this.children.push(new myOctree.Cell(this.tree, Vec.of(x + w2, y + h2, z + d2), Vec.of(w2, h2, d2), this.level + 1));
  for (var i = 0; i < this.points.length; i++) {
    this.addToChildren(this.points[i], this.data[i]);
  }
};


myOctree.Cell.prototype.point_search = function (p, r, result, options) {
  if (this.points.length > 0 && this.children.length == 0) {
    for (var i = 0; i < this.points.length; i++) {
      var dist = this.points[i].minus(p).norm();
      if (dist <= r) {
        if (dist == 0 && options.notSelf)
          continue;
        result.points.push(this.points[i]);
        if (options.includeData) result.data.push(this.data[i]);
      }
    }
  }

  var children = this.children;

  if (children.length > 0) {
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.points.length > 0) {
        if (p[0] < child.position[0] - r || p[0] > child.position[0] + child.size[0] + r ||
            p[1] < child.position[1] - r || p[1] > child.position[1] + child.size[1] + r ||
            p[2] < child.position[2] - r || p[2] > child.position[2] + child.size[2] + r
          ) {
          continue;
        }
        child.point_search(p, r, result, options);
      }
    }
  }
};
