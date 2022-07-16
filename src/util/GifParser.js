/**
 * Tool for parsing gif files and decoding it's data to frames.
 *
 * @author "Matt Way" (https://github.com/matt-way), Nikita Agafonov (https://github.com/lightest)
 * @copyright (c) 2015 Matt Way, (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 *
 * @note Based on https://github.com/matt-way/gifuct-js
 *
 */

import GIF from 'js-binary-schema-parser/lib/schemas/gif'
import { parse } from 'js-binary-schema-parser'
import { buildStream } from 'js-binary-schema-parser/lib/parsers/uint8'

/**
 * Deinterlace function from https://github.com/shachaf/jsgif
 */

export const deinterlace = (pixels, width) => {
  const newPixels = new Array(pixels.length)
  const rows = pixels.length / width
  const cpRow = function(toRow, fromRow) {
    const fromPixels = pixels.slice(fromRow * width, (fromRow + 1) * width)
    newPixels.splice.apply(newPixels, [toRow * width, width].concat(fromPixels))
  }

  // See appendix E.
  const offsets = [0, 4, 2, 1]
  const steps = [8, 8, 4, 2]

  var fromRow = 0
  for (var pass = 0; pass < 4; pass++) {
    for (var toRow = offsets[pass]; toRow < rows; toRow += steps[pass]) {
      cpRow(toRow, fromRow)
      fromRow++
    }
  }

  return newPixels
}


/**
 * javascript port of java LZW decompression
 * Original java author url: https://gist.github.com/devunwired/4479231
 */

export const lzw = (minCodeSize, data, pixelCount, memoryBuffer, bufferOffset) => {
  const MAX_STACK_SIZE = 4096
  const nullCode = -1
  const npix = pixelCount
  var available,
    clear,
    code_mask,
    code_size,
    end_of_information,
    in_code,
    old_code,
    bits,
    code,
    i,
    datum,
    data_size,
    first,
    top,
    bi,
    pi

  // const dstPixels = new Array(pixelCount)
  // const prefix = new Array(MAX_STACK_SIZE)
  // const suffix = new Array(MAX_STACK_SIZE)
  // const pixelStack = new Array(MAX_STACK_SIZE + 1)

  const dstPixels = new Uint8Array(memoryBuffer, bufferOffset, pixelCount)
  const prefix = new Uint16Array(MAX_STACK_SIZE)
  const suffix = new Uint16Array(MAX_STACK_SIZE)
  const pixelStack = new Uint8Array(MAX_STACK_SIZE + 1)

  // Initialize GIF data stream decoder.
  data_size = minCodeSize
  clear = 1 << data_size
  end_of_information = clear + 1
  available = clear + 2
  old_code = nullCode
  code_size = data_size + 1
  code_mask = (1 << code_size) - 1
  for (code = 0; code < clear; code++) {
    // prefix[code] = 0
    suffix[code] = code
  }

  // Decode GIF pixel stream.
  var datum, bits, count, first, top, pi, bi
  datum = bits = count = first = top = pi = bi = 0
  for (i = 0; i < npix; ) {
    if (top === 0) {
      if (bits < code_size) {
        // get the next byte
        datum += data[bi] << bits

        bits += 8
        bi++
        continue
      }
      // Get the next code.
      code = datum & code_mask
      datum >>= code_size
      bits -= code_size
      // Interpret the code
      if (code > available || code == end_of_information) {
        break
      }
      if (code == clear) {
        // Reset decoder.
        code_size = data_size + 1
        code_mask = (1 << code_size) - 1
        available = clear + 2
        old_code = nullCode
        continue
      }
      if (old_code == nullCode) {
        pixelStack[top++] = suffix[code]
        old_code = code
        first = code
        continue
      }
      in_code = code
      if (code == available) {
        pixelStack[top++] = first
        code = old_code
      }
      while (code > clear) {
        pixelStack[top++] = suffix[code]
        code = prefix[code]
      }

      first = suffix[code] & 0xff
      pixelStack[top++] = first

      // add a new string to the table, but only if space is available
      // if not, just continue with current table until a clear code is found
      // (deferred clear code implementation as per GIF spec)
      if (available < MAX_STACK_SIZE) {
        prefix[available] = old_code
        suffix[available] = first
        available++
        if ((available & code_mask) === 0 && available < MAX_STACK_SIZE) {
          code_size++
          code_mask += available
        }
      }
      old_code = in_code
    }
    // Pop a pixel off the pixel stack.
    top--
    dstPixels[pi++] = pixelStack[top]
    i++
  }

  // for (i = pi; i < npix; i++) {
  //   dstPixels[i] = 0 // clear missing pixels
  // }

  return dstPixels
}

export const lzw_contiguous = (minCodeSize, data, pixelCount) => {
  console.log("pixelCount", pixelCount);
  const MAX_STACK_SIZE = 4096
  const nullCode = -1
  const npix = pixelCount
  var available,
    clear,
    code_mask,
    code_size,
    end_of_information,
    in_code,
    old_code,
    bits,
    code,
    i,
    datum,
    data_size,
    first,
    top,
    bi,
    pi

  // const dstPixels = new Array(pixelCount)
  // const prefix = new Array(MAX_STACK_SIZE)
  // const suffix = new Array(MAX_STACK_SIZE)
  // const pixelStack = new Array(MAX_STACK_SIZE + 1)

  const dstPixels = new Uint8Array(pixelCount)
  const prefix = new Uint16Array(MAX_STACK_SIZE)
  const suffix = new Uint16Array(MAX_STACK_SIZE)
  const pixelStack = new Uint8Array(MAX_STACK_SIZE + 1)

  // Initialize GIF data stream decoder.
  data_size = minCodeSize
  clear = 1 << data_size
  end_of_information = clear + 1
  available = clear + 2
  old_code = nullCode
  code_size = data_size + 1
  code_mask = (1 << code_size) - 1
  for (code = 0; code < clear; code++) {
    // prefix[code] = 0
    suffix[code] = code
  }

  // Decode GIF pixel stream.
  var datum, bits, count, first, top, pi, bi
  datum = bits = count = first = top = pi = bi = 0
  for (i = 0; i < npix && bi < data.length; ) {
    if (top === 0) {
      if (bits < code_size) {
        // get the next byte
        datum += data[bi] << bits

        bits += 8
        bi++
        continue
      }
      // if (bi === 49418) {
      //   console.log("bi", bi, "pi", pi, "top", top, "bits", bits, "code_size", code_size, "code_mask", code_mask);
      //   console.log("code", code, "next code", datum & code_mask, "old_code", old_code, "datum_shifted", datum >> code_size);
      // }
      // Get the next code.
      code = datum & code_mask
      datum >>= code_size
      bits -= code_size
      // Interpret the code
      if (code > available || code == end_of_information) {
        //end of info bi 692436 pi 2513585 top 0 bits 2 code_size 9 code_mask 511
        // console.log("end of info", "bi", bi, "pi", pi, "top", top, "bits", bits, "code_size", code_size, "code_mask", code_mask);
        // console.log("datum", datum, "code", code, "next code", datum & code_mask, "available", available);
        datum = bits = count = first = top = 0;
        code_size = data_size + 1
        code_mask = (1 << code_size) - 1
        available = clear + 2
        old_code = nullCode
        // prefix.fill(0);
        // suffix.fill(0);
        // pixelStack.fill(0);
        // for (code = 0; code < clear; code++) {
        //   // prefix[code] = 0
        //   suffix[code] = code
        // }
        continue;
        break
      }
      if (code === clear) {
        // Reset decoder.
        code_size = data_size + 1
        code_mask = (1 << code_size) - 1
        available = clear + 2
        old_code = nullCode
      //   console.log("code is clear", "bi", bi, "pi", pi, "top", top, "bits", bits, "code_size", code_size, "code_mask", code_mask);
      // console.log("next code", datum & code_mask);
        continue
      }
      if (old_code === nullCode) {
        pixelStack[top++] = suffix[code]
        old_code = code
        first = code
        continue
      }
      in_code = code
      if (code === available) {
        pixelStack[top++] = first
        code = old_code
      }
      while (code > clear && top <= MAX_STACK_SIZE) {
        pixelStack[top++] = suffix[code]
        code = prefix[code]
      }

      first = suffix[code] & 0xff
      pixelStack[top++] = first

      // add a new string to the table, but only if space is available
      // if not, just continue with current table until a clear code is found
      // (deferred clear code implementation as per GIF spec)
      if (available < MAX_STACK_SIZE) {
        // if (available === 258 && old_code === 258) {
        //   console.log("258");
        // }
        prefix[available] = old_code
        suffix[available] = first
        available++
        if ((available & code_mask) === 0 && available < MAX_STACK_SIZE) {
          code_size++
          code_mask += available
        }
      }
      old_code = in_code
    }
    // Pop a pixel off the pixel stack.
    top--
    dstPixels[pi++] = pixelStack[top]
    i++
  }

  // for (i = pi; i < npix; i++) {
  //   dstPixels[i] = 0 // clear missing pixels
  // }

  return dstPixels
}

export const parseGIF = arrayBuffer => {
  const byteData = new Uint8Array(arrayBuffer)
  return parse(buildStream(byteData), GIF)
}

const generatePatch = image => {
  const totalPixels = image.pixels.length
  const patchData = new Uint8ClampedArray(totalPixels * 4)
  for (var i = 0; i < totalPixels; i++) {
    const pos = i * 4
    const colorIndex = image.pixels[i]
    const color = image.colorTable[colorIndex] || [0, 0, 0]
    patchData[pos] = color[0]
    patchData[pos + 1] = color[1]
    patchData[pos + 2] = color[2]
    patchData[pos + 3] = colorIndex !== image.transparentIndex ? 255 : 0
  }

  return patchData
}

export const decompressFrame = (frame, gct, buildImagePatch, memoryBuffer, memoryOffset) => {
  if (!frame.image) {
    console.warn('gif frame does not have associated image.')
    return
  }

  const { image } = frame

  // get the number of pixels
  const totalPixels = image.descriptor.width * image.descriptor.height
  // do lzw decompression
  var pixels = lzw(image.data.minCodeSize, image.data.blocks, totalPixels, memoryBuffer, memoryOffset)

  // deal with interlacing if necessary
  if (image.descriptor.lct.interlaced) {
    pixels = deinterlace(pixels, image.descriptor.width)
  }

  const resultImage = {
    pixels: pixels,
    dims: {
      top: frame.image.descriptor.top,
      left: frame.image.descriptor.left,
      width: frame.image.descriptor.width,
      height: frame.image.descriptor.height
    }
  }

  // color table
  if (image.descriptor.lct && image.descriptor.lct.exists) {
    resultImage.colorTable = image.lct
  } else {
    resultImage.colorTable = gct
  }

  // add per frame relevant gce information
  if (frame.gce) {
    resultImage.delay = (frame.gce.delay || 10) * 10 // convert to ms
    resultImage.disposalType = frame.gce.extras.disposal
    // transparency
    if (frame.gce.extras.transparentColorGiven) {
      resultImage.transparentIndex = frame.gce.transparentColorIndex
    }
  }

  // create canvas usable imagedata if desired
  if (buildImagePatch) {
    resultImage.patch = generatePatch(resultImage)
  }

  return resultImage
}

export const decompressFrames = (parsedGif, buildImagePatches) => {
  // return parsedGif.frames
  //   .filter(f => f.image)
  //   .map(f => decompressFrame(f, parsedGif.gct, buildImagePatches))
  let totalPixels = 0;
  let framesWithData = 0;
  let out ;
  let i, j = 0;

  for (i = 0; i < parsedGif.frames.length; i++) {
    if (parsedGif.frames[i].image)
    {
      totalPixels += parsedGif.frames[i].image.descriptor.width * parsedGif.frames[i].image.descriptor.height;
      framesWithData++;
    }
  }

  // const dstPixels = new Uint16Array(totalPixels);
  // let frameStart = 0;
  // let frameEnd = 0;

  const buf = new ArrayBuffer(totalPixels);
  let bufOffset = 0;
  out = new Array(framesWithData);

  for (i = 0; i < parsedGif.frames.length; i++) {
    if (parsedGif.frames[i].image)
    {
      out[j] = decompressFrame(parsedGif.frames[i], parsedGif.gct, buildImagePatches, buf, bufOffset);
      bufOffset += parsedGif.frames[i].image.descriptor.width * parsedGif.frames[i].image.descriptor.height;
      // out[j] = decompressFrame(parsedGif.frames[i], parsedGif.gct, buildImagePatches, prefix, suffix, pixelStack, dstPixels, frameStart, frameEnd);
      j++;
    }
  }

  return out;
}

export const decompressFramesContiguous = (parsedGif, buildImagePatches) => {
  // return parsedGif.frames
  //   .filter(f => f.image)
  //   .map(f => decompressFrame(f, parsedGif.gct, buildImagePatches))
  let totalPixels = 0;
  let totalBlocks = 0;
  let out = [];
  let frameData = [];
  let i, j = 0;
  let frameStartIdx = 0;
  let pixelsPerFrame = 0;

  for (i = 0, j = 0; i < parsedGif.frames.length; i++) {
    if (parsedGif.frames[i].image) {
      pixelsPerFrame = parsedGif.frames[i].image.descriptor.width * parsedGif.frames[i].image.descriptor.height;
      totalPixels += pixelsPerFrame;
      totalBlocks += parsedGif.frames[i].image.data.blocks.length;
      // frameData[j] = {
      //   frameStart: frameStartIdx,
      //   frameEnd: frameStartIdx + pixelsPerFrame - 1,
      //   top: parsedGif.frames[i].image.descriptor.top,
      //   left: parsedGif.frames[i].image.descriptor.left,
      //   width: parsedGif.frames[i].image.descriptor.width,
      //   height: parsedGif.frames[i].image.descriptor.height
      // };
      // frameStartIdx = frameStartIdx + pixelsPerFrame;
      j++
    }
  }

  const allBlocks = new Uint8Array(totalBlocks);
  // const allPixels = new Uint8Array(totalPixels);

  let k;
  for (i = 0, j = 0; i < parsedGif.frames.length; i++) {
    if (parsedGif.frames[i].image) {
      allBlocks.set(parsedGif.frames[i].image.data.blocks, j);
      j += parsedGif.frames[i].image.data.blocks.length;
      // if (j === 0) {
      //   allBlocks.set(parsedGif.frames[i].image.data.blocks, j);
      //   j += parsedGif.frames[i].image.data.blocks.length;
      // } else {
      //   for (k = 1; k < parsedGif.frames[i].image.data.blocks.length; k++) {
      //     allBlocks[j + k - 1] = parsedGif.frames[i].image.data.blocks[k];
      //   }
      //   j += parsedGif.frames[i].image.data.blocks.length - 1;
      // }
    }
  }

  console.log(allBlocks);
  window.allBlocks = allBlocks;

  const decompressedPixels = lzw_contiguous(parsedGif.frames[1].image.data.minCodeSize, allBlocks, totalPixels);

  // const dstPixels = new Uint16Array(totalPixels);
  // let frameStart = 0;
  // let frameEnd = 0;

  // for (i = 0; i < parsedGif.frames.length; i++) {
  //   if (parsedGif.frames[i].image) {
  //     out[j] = decompressFrame(parsedGif.frames[i], parsedGif.gct, buildImagePatches);
  //     // out[j] = decompressFrame(parsedGif.frames[i], parsedGif.gct, buildImagePatches, prefix, suffix, pixelStack, dstPixels, frameStart, frameEnd);
  //     j++;
  //   }
  // }

  return decompressedPixels;
}
