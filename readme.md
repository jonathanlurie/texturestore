# TODO
- A configuration manager, to deal with different datasets, their LOD, chunk size, URL pattern, etc.
- Wrapper object for [texturestore + bufferqueue] that will expose very few of their logic. Internally, the chunk id will be its URL, but this should not be exposed



1. The dataset/plane intersection establishes a list of chunks that could be needed
2. We establish a priority upon which we desire to get the chunks, based on the LOD we need
3. We query the texturestore with this priority, some chunks may already be in store, some may have to be downloaded using the priority queue

# How the chunk query works
1. send a getChunk request to the wrapper (using dataset ID, LOD, voxel offset x, y, z)
2. Provide a callback to this request, to be called with the chunk as argument
2. looking in store if available

## Case A: The chunk is available
1. straight call the callback with the chunk object

## Case B: The chunk is not available
1. Ask bufferqueue to put it in queue with the priority the chunk was given earlier
2. download progresses...
3. download ends, the bufferqueue 'success' event is called with the buffer and the URL
4. the wrapper looks up
