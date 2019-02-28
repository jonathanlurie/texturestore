'use strict';

/**
 * Holds an object of type THREE.DataTexture3D as data
 */
class Chunk {
  constructor(id, t) {
    this._id = id;
    this._texture3D = t;
    this._metadata = {};
    this._timestampCreated = Date.now();
    this._timestampLastUse = 0;
  }


  getId() {
    return this._id
  }


  getTexture3D() {
    this._timestampLastUse = Date.now();
    return this._texture3D
  }


  getByteSize() {
    return this._texture3D.image.data.byteLength
  }


  getTimestampLastUse() {
    return this._timestampLastUse
  }


  addMetadata(k, v) {
    this._metadata[k] = v;
  }


  getMetadata(key=null) {
    if(!key){
      return this._metadata
    }

    if(key in this._metadata){
      return this._metadata[key]
    }

    return null
  }


}

/**
 * Handy function to deal with option object we pass in argument of function.
 * Allows the return of a default value if the `optionName` is not available in
 * the `optionObj`
 * @param {Object} optionObj - the object that contain the options
 * @param {String} optionName - the name of the option desired, attribute of `optionObj`
 * @param {any} optionDefaultValue - default values to be returned in case `optionName` is not an attribute of `optionObj`
 */
function getOption(optionObj, optionName, optionDefaultValue) {
  return (optionObj && optionName in optionObj) ? optionObj[optionName] : optionDefaultValue
}

class ChunkCollection {

  /**
   * @param {Object} options - the option object
   * @param {number} options.maxSizeMegaByte - Maximum size of the whole colelction in MB (default: 500)
   * @param {number} options.cleaningThreshold - When the max is reached, the cleaning is done until the total size is just under `maxSizeMegaByte * cleaningThreshold` (default: 0.8)
   */
  constructor(options={}) {
    this._collection = {};
    this._maxByteSize = getOption(options, 'maxSizeMegaByte', 500) * 1024 * 1024;
    this._thresholdByteSize = this._maxByteSize * getOption(options, 'cleaningThreshold', 0.8);
    this._totalByteSize = 0;
  }

  getTotalByteSize(force=false) {
    if(force) {
      this._computeByteSize();
    }

    return this._totalByteSize
  }

  createChunk(id, texture3D) {
    let t = new Chunk(id, texture3D);
    this._collection[id] = t;
    this._totalByteSize += texture3D.image.data.byteLength;

    if(this._totalByteSize > this._maxByteSize) {
      this._clean();
    }

    console.log(~~(this._totalByteSize / 1024**2) + ' MB');

    return t
  }


  deleteChunk(id) {
    if(id in this._collection) {
      this._totalByteSize -= this._collection[id].getByteSize();
      delete this._collection[id];
    }
  }


  getChunk(id) {
    if(id in this._collection) {
      return this._collection[id]
    } else {
      return null
    }
  }


  _getAllTimestampLastUse() {
    // return Object.keys(this._collection)
    // .map(function (k) {
    //   return {
    //     id: k,
    //     timestampLastUse: that._collection[k].getTimestampLastUse()
    //   }
    // })
    // .sort((a, b) => a.timestampLastUse - a.timestampLastUse)

    let ids = Object.keys(this._collection);
    let idTs = new Array(ids.length);
    for(let i=0; i<idTs.length; i++){
      let id = ids[i];
      idTs[i] = {
        id: id,
        timestampLastUse: this._collection[id].getTimestampLastUse()
      };
    }

    idTs.sort((a, b) => a.timestampLastUse - a.timestampLastUse);
    return idTs
  }


  _clean() {
    console.time('_getAllTimestampLastUse');
    let idTs = this._getAllTimestampLastUse();
    console.timeEnd('_getAllTimestampLastUse');

    for(let i=0; i<idTs.length; i++) {
      let id = idTs[i].id;
      let chunk = this._collection[id];
      let byteSize = chunk.getByteSize();
      delete this._collection[id];
      this._totalByteSize -= byteSize;

      if(this._totalByteSize <= this._thresholdByteSize){
        break
      }
    }
  }


  _computeByteSize() {
    let ids = Object.keys(this._collection);
    let byteSize = 0;
    for(let i=0; i<ids.length; i++) {
      byteSize += this._collection[ids[i]].getByteSize();
    }

    this._totalByteSize = byteSize;
  }

}

var index = ({
  ChunkCollection, 
});

module.exports = index;
//# sourceMappingURL=texturestore.js.map
