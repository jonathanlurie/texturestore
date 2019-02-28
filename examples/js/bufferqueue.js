(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.bufferqueue = factory());
}(this, (function () { 'use strict';

  /**
   * A queue to add and pop string. It also provides an arbitrary remove function.
   * A queue is first-in-first-out.
   * Elements in this queue must be strings
   */
  class Queue {

    constructor() {
      this._q = [];
      // this is to support the has function in constant time
      this._keys = {};
    }


    /**
     * Add a string at the end of the queue. Not added again if already in there.
     * @param {string} str - some string to add
     */
    add(str) {
      if (!(str in this._keys)){
        this._q.unshift(str);
        this._keys[str] = 1;
      }
    }


    /**
     * Check if this queue contains a given string
     * @return {boolean} true if this queue has a given string, false if not
     */
    has(str) {
      return (str in this._keys)
    }


    /**
     * Extract the first element
     * @return {string} the first element
     */
    pop() {
      let str = null;
      if(this._q.length){
        str = this._q.pop();
        delete this._keys[str];
      }
      return str
    }


    /**
     * Is the queue empty?
     * @return {boolean} true if empty, false if not
     */
    isEmpty() {
      return !this._q.length
    }


    /**
     * Get the number of element in the queue
     * @param {number}
     */
    size() {
      return this._q.length
    }


    /**
     * Get the first element of the queue without removing it
     * (Not sure how useful is that)
     * @return {string}
     */
    first() {
      return this._q.length ? this._q[0] : null
    }


    /**
     * Get the last element of the queue without removing it
     * (Not sure how useful is that)
     * @return {string}
     */
    last() {
      return this._q.length ? this._q[this._q.length - 1] : null
    }


    /**
     * Remove an element from the queue and returns it
     * @param {string} str - an element to remove
     * @return {string | null}
     */
    remove(str) {
      let strToRem = null;
      let index = this._q.indexOf(str);
      if (index > -1) {
        strToRem = this._q.splice(index, 1);
        delete this._keys[strToRem];
      }
      return strToRem
    }


    /**
     * Remove all the elements of the queue
     */
    reset() {
      this._q = [];
      this._keys = {};
    }

  }

  /**
   * This priority queue works with levels of priority, 0 beeing the highest priority
   * and following level will be of decreasing priority.
   * In term of implementation, PriorityQueue instanciates N Queues, where N is the
   * number of priority levels. The number of priority levels has to be given at
   * the creation of a PriorityQueue instance.
   */
  class PriorityQueue {
    constructor(levels=3) {
      this._qs = Array.from({length: levels}, () => new Queue());
      this._probabilityMap = new Array(levels);
      this._makeProbabilityMap();
    }

    _makeProbabilityMap() {
      let levels = this._qs.length;
      let factors = Array.from({length: levels}, (x, i) => 1/Math.pow(2,i));
      let factorSum = factors.reduce((acc, x) => acc + x);

      for(let i=0; i<levels; i++) {
        this._probabilityMap[i] = factors[i] / factorSum;

        if (i>0) {
          this._probabilityMap[i] += this._probabilityMap[i-1];
        }
      }

      console.log(this._probabilityMap);
    }

    /**
     * Get the level of priority of a given string
     * @return {number} zero is the highest priority, -1 means the element is NOT
     * in the queue
     */
    getPriority(str) {
      for(let i=0; i<this._qs.length; i++) {
        if(this._qs[i].has(str)){
          return i
        }
      }
      return -1
    }


    /**
     * Checks if a string is in the queue. Optionally, we can verify a specific
     * level only.
     * @param {string} str - string to verify the presence in the queue
     * @param {number} priority - OPTIONAL the priority (must be in [0, level-1])
     * @return {boolean}
     */
    has(str, priority=-1) {
      if(~priority) {
        return this._qs[priority].has(str)
      }

      for(let i=0; i<this._qs.length; i++) {
        if(this._qs[i].has(str)){
          return true
        }
      }
      return false
    }


    /**
     * Add a string to the queue with a given priority.
     * If the string is already present in the queue with the same level of priority or higher, then nothing is done.
     * If the string is already present but with a different level of priority, then
     * it is removed and added with the provided level or priority.
     * @param {string} str - the string to add
     * @param {number} priority - the priority (must be in [0, level-1])
     * @param {boolean} true if added, false if not (because already in with a higher priority)
     */
    add(str, priority) {
      let existingPriority = this.getPriority(str);

      if(existingPriority >= priority) {
        return false
      }

      if(existingPriority) {
        this.remove(str);
      }

      this._qs[priority].add(str);
      return true
    }


    /**
     * Get the the element with the highest priority and remove it from the queue
     * @return {string|null} can return null if the queue is empty
     */
    pop_ORIG() {
      for(let i=0; i<this._qs.length; i++) {
        if(!this._qs[i].isEmpty()) {
          return this._qs[i].pop()
        }
      }

      return null
    }


    /**
     * This version of pop relies on the probability map to make sure that some lower
     * priorities items are getting popped every now and then, even if there are still
     * elements in higher priority queues
     */
    pop() {
      if(this.isEmpty()){
        return null
      }

      // if the first(s) priorities are empty, we dont want to have the random seed
      // within their range, so we pad if to make sure it lands in an area corresponding
      // to some non-empty priority level
      let probPadding = 0;

      for(let i=0; i<this._qs.length; i++){
        if(this._qs[i].isEmpty()){
          probPadding = this._probabilityMap[i];
        } else if(probPadding !== 0) {
          // in case we have empty, non-empty, empty. We want to stop at the first non-empty
          break
        }
      }

      let seed = probPadding + Math.random() * (1 - probPadding);
      let levelToPop = 0;

      // check the level corresponding to the seed
      for(let i=0; i<this._qs.length; i++){
        if(seed < this._probabilityMap[i]) {
          levelToPop = i;
          break
        }
      }

      // if the seeded level is empty,
      // we pop the one of higher priority that is non-empty
      if(this._qs[levelToPop].isEmpty()) {
        for(let i=levelToPop; i==0; i--) {
          if(!this._qs[i].isEmpty()) {
            return this._qs[i].pop()
          }
        }
      }

      return this._qs[levelToPop].pop()
    }


    /**
     * Check if the priority queue is empty (= if all the per-level-queues are all empty)
     * @return {boolean} true if empty, false if not empty
     */
    isEmpty() {
      return this._qs.every(q => q.isEmpty())
    }


    /**
     * Get the total number of elements in the priority queue, or optionnaly, for a specific
     * level of priority
     * @param {number} priority - OPTIONAL level of priority
     * @param {number} number of elements
     */
    size(priority = -1) {
      if(~priority) {
        return this._qs[priority].size()
      }

      let s = 0;
      for(let i=0; i<this._qs.length; i++) {
        s += this._qs[i].size();
      }
      return s
    }


    /**
     * Get the size of the queue for each priority level
     * @return {array}
     */
    sizePerPriority() {
      return this._qs.map(q => q.size())
    }


    /**
     * Note: this should be used as rarely as possible since it does not respect the logic
     * of a queue.
     * Remove an element. If null is returned, this means the element was not in the queue.
     * @param {string} - str, the element to remove
     * @return {string|null} the element that was jsut removed
     */
    remove(str) {
      let elem = null;
      for(let i=0; i<this._qs.length; i++) {
        elem = elem || this._qs[i].remove(str);
      }
      return elem
    }


    /**
     * Reset the whole priority queue, empty it all. No value returned.
     */
    reset() {
      for(let i=0; i<this._qs.length; i++) {
        this._qs[i].reset();
      }
    }

  }

  /**
   * The EventManager deals with events, create them, call them.
   * This class is mostly for being inherited from.
   */
  class EventManager {
    /**
     * Constructor
     */
    constructor() {
      this._events = {};
    }


    /**
     * Define an event, with a name associated with a function
     * @param  {String} eventName - Name to give to the event
     * @param  {Function} callback - function associated to the even
     */
    on(eventName, callback) {
      if (typeof callback === 'function') {
        if (!(eventName in this._events)) {
          this._events[eventName] = [];
        }
        this._events[eventName].push(callback);
      } else {
        console.warn('The callback must be of type Function');
      }
    }


    emit(eventName, args = []) {
      // the event must exist and be non null
      if ((eventName in this._events) && (this._events[eventName].length > 0)) {
        const events = this._events[eventName];
        for (let i = 0; i < events.length; i += 1) {
          events[i](...args);
        }
      } else {
        console.warn(`No function associated to the event ${eventName}`);
      }
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

  /**
   *
   *
   * Emitted events:
   * - 'added': when a new element to download is added to the queue
   * - 'removed': when an element is removed (and will not be downloaded)
   * - 'reseted': when the whole queue is reseted
   * - 'downloading': when a file is starting to be downloading (after being popped from the queue)
   * - 'failed': when a file could not be downloaded properly (status above 2xx)
   * - 'aborted': when a file download is aborted by an explicit abort() call
   * - 'success': when a file has been successfully downloaded and converted into an ArrayBuffer
   *
   */
  class BufferQueue extends EventManager {

    /**
     * @param {Object} options - the option object
     * @param {number} options.priorityLevels - Number of levels of priority to have in the priority queue (default: 3)
     * @param {number} options.concurentDownloads - number of concurent downloads possible (default: 4)
     * @param {Headers} options.httpSettings - the optional settings for the HTTP request (default: {}) see 'init' object from https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
     */
    constructor(options) {
      super();
      this._concurentDownloads = getOption(options, 'concurentDownloads', 4);
      this._pq = new PriorityQueue(getOption(options, 'priorityLevels', 3));
      this._httpSettings = getOption(options, 'httpSettings', {});
      this._dlControllers = {}; // keeps the 'signal' and tracks which files are currently being downloaded
    }


    /**
     * Get the level of priority of a given string
     * @return {number} zero is the highest priority, -1 means the element is NOT
     * in the queue
     */
    getPriority(str) {
      return this._pq.getPriority(str)
    }


    /**
     * Checks if a string is in the queue. Optionally, we can verify a specific
     * level only.
     * @param {string} str - string to verify the presence in the queue
     * @param {number} priority - OPTIONAL the priority (must be in [0, level-1])
     * @return {boolean}
     */
    has(str, priority=-1) {
      return this._pq.has(str, priority)
    }


    /**
     * Add a string to the queue with a given priority.
     * If the string is already present in the queue with the same level of priority or higher, then nothing is done.
     * If the string is already present but with a different level of priority, then
     * it is removed and added with the provided level or priority.
     *
     * Emits the event 'added' with the str as argument if properly added.
     *
     * @param {string} str - the string to add
     * @param {number} priority - the priority (must be in [0, level-1])
     * @param {boolean} true if added, false if not (because already in with a higher priority)
     */
    add(str, priority) {
      if(this._pq.add(str, priority)){
        this.emit('added', [str, priority]);
        this._tryNext();
      }
    }


    /**
     * Check if the priority queue is empty (= if all the per-level-queues are all empty)
     * @return {boolean} true if empty, false if not empty
     */
    isEmpty() {
      return this._pq.isEmpty()
    }


    /**
     * Get the total number of elements in the priority queue, or optionnaly, for a specific
     * level of priority
     * @param {number} priority - OPTIONAL level of priority
     * @param {number} number of elements
     */
    size() {
      return this._pq.size()
    }


    /**
     * Get the size of the queue for each priority level
     * @return {array}
     */
    sizePerPriority() {
      return this._pq.sizePerPriority()
    }


    /**
     * Note: this should be used as rarely as possible since it does not respect the logic
     * of a queue.
     * Remove an element. If null is returned, this means the element was not in the queue.
     *
     * Emits the event 'removed' if the str as argument if properly removed
     *
     * @param {string} - str, the element to remove
     * @return {string|null} the element that was jsut removed
     */
    remove(str){
      if(this._pq.remove(str)) {
        this.emit('removed', [str]);
      }
    }


    /**
     * Reset the whole priority queue, empty it all. No value returned.
     *
     * Emits the event 'reseted' without any argument
     */
    reset() {
      this._pq.reset();
      this._dlControllers = {};
      this.emit('reseted', []);
    }


    abort(str) {
      // TODO
      if(str in this._dlControllers) {
        this._dlControllers[str].abort();
      }
    }


    abortAll() {
      let k = Object.keys(this._dlControllers);
      for(let i=0; i<k.length; i++) {
        this._dlControllers[k[i]].abort();
      }
    }


    /**
     *
     *
     */
    // start() {
    //   this._tryNext()
    // }


    _tryNext() {
      let nbCurrentDl = Object.keys(this._dlControllers).length;
      if(nbCurrentDl >= this._concurentDownloads)
        return

      let toBeDl = this._pq.pop();

      if(toBeDl) {
        this._startDownload(toBeDl);
      }
    }


    _startDownload(str){
      let that = this;


      let myRequest = new Request(str ,this._httpSettings);

      //let signal = new AbortController()
      //this._dlControllers[str] = signal
      this._dlControllers[str] = myRequest.signal;

      this.emit('downloading', [str]);

      fetch(myRequest/*, { signal }*/).then(response => {
        if(!response.ok){
          that.emit('failed', [url, response]);
          return null
        }
        return response.blob()
      }).then(myBlob => {
        delete that._dlControllers[str];

        if(!myBlob)
          return

        let fileReader = new FileReader();
        fileReader.onload = function(event) {
          let buf = event.target.result;
          that._tryNext();
          that.emit('success', [str, buf]);
        };
        fileReader.readAsArrayBuffer(myBlob);
      }).catch(function(err) {
        delete that._dlControllers[str];
        that._tryNext();

        if(err.code === 20){
          that.emit('aborted', [str]);
        } else {
          that.emit('failed', [str, err]);
        }
      });
    }



  }

  var index = ({
    BufferQueue
  });

  return index;

})));
//# sourceMappingURL=bufferqueue.js.map
