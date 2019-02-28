
/**
 * Holds an object of type THREE.DataTexture3D as data
 */
class Chunk {
  constructor(id, t) {
    this._id = id
    this._texture3D = t
    this._metadata = {}
    this._timestampCreated = Date.now()
    this._timestampLastUse = 0
  }


  getId() {
    return this._id
  }


  getTexture3D() {
    this._timestampLastUse = Date.now()
    return this._texture3D
  }


  getByteSize() {
    return this._texture3D.image.data.byteLength
  }


  getTimestampLastUse() {
    return this._timestampLastUse
  }


  addMetadata(k, v) {
    this._metadata[k] = v
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


export default Chunk
