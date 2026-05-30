import logger from '../utils/logger.js';

export class RecursiveCharacterTextSplitter {
  constructor({ chunkSize = 500, chunkOverlap = 100 } = {}) {
    this.chunkSize = Number(chunkSize) || 500;
    this.chunkOverlap = Number(chunkOverlap) || 100;
    this.separators = ["\n\n", "\n", " ", ""];
  }

  splitText(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }
    return this._splitText(text, this.separators);
  }

  _splitText(text, separators) {
    const finalChunks = [];
    
    // Choose the first separator that actually exists in this text segment
    let separator = separators[separators.length - 1];
    let nextSeparators = [];
    
    for (let i = 0; i < separators.length; i++) {
      const s = separators[i];
      if (s === "") {
        separator = s;
        nextSeparators = [];
        break;
      }
      if (text.includes(s)) {
        separator = s;
        nextSeparators = separators.slice(i + 1);
        break;
      }
    }

    // Split using selected separator
    let splits;
    if (separator === "") {
      splits = Array.from(text);
    } else {
      splits = text.split(separator);
    }

    let goodSplits = [];
    for (const split of splits) {
      if (split.length < this.chunkSize) {
        goodSplits.push(split);
      } else {
        // If we have accumulated good splits, flush them to chunks
        if (goodSplits.length > 0) {
          const merged = this._mergeSplits(goodSplits, separator);
          finalChunks.push(...merged);
          goodSplits = [];
        }
        
        // If there are no more separators left, we must hard-split this long string
        if (nextSeparators.length === 0) {
          let start = 0;
          while (start < split.length) {
            finalChunks.push(split.substring(start, start + this.chunkSize));
            // Shift start position by (chunkSize - chunkOverlap)
            start += Math.max(1, this.chunkSize - this.chunkOverlap);
          }
        } else {
          // Recursively split the long segment with the remaining separators
          const recursiveSplits = this._splitText(split, nextSeparators);
          finalChunks.push(...recursiveSplits);
        }
      }
    }

    // Flush any remaining splits
    if (goodSplits.length > 0) {
      const merged = this._mergeSplits(goodSplits, separator);
      finalChunks.push(...merged);
    }

    return finalChunks;
  }

  _mergeSplits(splits, separator) {
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;

    for (const split of splits) {
      const splitLength = split.length;
      const separatorLength = currentChunk.length > 0 ? separator.length : 0;
      
      // If adding this split exceeds the chunkSize, we save the current chunk
      if (currentLength + splitLength + separatorLength > this.chunkSize) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.join(separator));
          
          // Re-build starting chunk with overlap
          let overlapChunk = [];
          let overlapLength = 0;
          
          // Traverse current chunk backwards to build the overlapping section
          for (let i = currentChunk.length - 1; i >= 0; i--) {
            const item = currentChunk[i];
            const itemSepLen = overlapChunk.length > 0 ? separator.length : 0;
            if (overlapLength + item.length + itemSepLen <= this.chunkOverlap) {
              overlapChunk.unshift(item);
              overlapLength += item.length + itemSepLen;
            } else {
              break;
            }
          }
          currentChunk = overlapChunk;
          currentLength = overlapLength;
        }
      }
      
      currentChunk.push(split);
      currentLength += splitLength + (currentChunk.length > 1 ? separator.length : 0);
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(separator));
    }

    return chunks;
  }
}

const chunkerService = {
  splitDocument: (text, options = {}) => {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: options.chunkSize || process.env.CHUNKER_SIZE,
      chunkOverlap: options.chunkOverlap || process.env.CHUNKER_OVERLAP
    });
    const chunks = splitter.splitText(text);
    logger.info(`Split document of size ${text.length} into ${chunks.length} chunks`);
    return chunks;
  }
};

export default chunkerService;
