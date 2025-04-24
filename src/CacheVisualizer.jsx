import React, { useState, useEffect, useRef } from 'react';

const ExplanationPanel = () => {
  return (
    <div className='border rounded p-4 bg-gray-50 mb-4 max-w-md'>
      <h3 className='text-lg font-bold mb-2'>How This Simulator Works</h3>

      <h4 className='font-semibold mt-3'>Cache Configuration</h4>
      <ul className='list-disc pl-5 mb-2 text-sm'>
        <li>
          <b>Cache Size</b>: Total storage the cache has
        </li>
        <li>
          <b>Block Size</b>: Size of each chunk of data
        </li>
        <li>
          <b>Associativity</b>: How flexible the cache is about where to store
          data:
          <ul className='list-circle pl-5'>
            <li>
              <b>Direct Mapped</b>: Each memory location maps to exactly one
              specific spot
            </li>
            <li>
              <b>Set-Associative</b>: Each location maps to one set but can go
              in any way in that set
            </li>
            <li>
              <b>Fully Associative</b>: Any memory block can go anywhere in the
              cache (maximum flexibility)
            </li>
          </ul>
        </li>
      </ul>

      <h4 className='font-semibold mt-3'>Memory Access Patterns</h4>
      <ul className='list-disc pl-5 mb-2 text-sm'>
        <li>
          <b>Sequential</b>: Like reading through an array (spatial locality)
        </li>
        <li>
          <b>Random</b>: Unpredictable memory accesses
        </li>
        <li>
          <b>Strided</b>: Regular jumps (like reading every 8th element)
        </li>
        <li>
          <b>Repeated</b>: Same few memory locations (temporal locality)
        </li>
      </ul>

      <h4 className='font-semibold mt-3'>Key Insights</h4>
      <ul className='list-disc pl-5 text-sm'>
        <li>
          <b>Cache Size</b>: Larger = better hit rate, but slower in real CPUs
        </li>
        <li>
          <b>Block Size</b>: Larger = better for sequential access, but may
          waste space
        </li>
        <li>
          <b>Associativity</b>: Higher = fewer conflicts, but more complex
          hardware
        </li>
        <li>Green text = HIT (fast), Red text = MISS (slow)</li>
        <li>Yellow highlight shows the most recently accessed location</li>
      </ul>
    </div>
  );
};

const CacheVisualizer = () => {
  const [cacheConfig, setCacheConfig] = useState({
    cacheSize: 256,
    blockSize: 32,
    associativity: 4,
  });

  const [accessPattern, setAccessPattern] = useState('sequential');
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ hits: 0, misses: 0, accesses: 0 });
  const [cacheState, setCacheState] = useState([]);
  const [memoryAccesses, setMemoryAccesses] = useState([]);
  const [currentAddress, setCurrentAddress] = useState(null);

  // Use ref to keep track of the interval
  const intervalRef = useRef(null);

  // Calculate cache organization
  const numBlocks = cacheConfig.cacheSize / cacheConfig.blockSize;

  // Handle fully associative case specially
  const isFullyAssociative = cacheConfig.associativity === 'fully';
  const numSets = isFullyAssociative
    ? 1
    : numBlocks / cacheConfig.associativity;

  const blockOffsetBits = Math.log2(cacheConfig.blockSize);
  const indexBits = isFullyAssociative ? 0 : Math.log2(numSets);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // For fully associative, create one set with ways equal to number of blocks
    // For other types, create normal set/way organization
    const effectiveAssociativity = isFullyAssociative
      ? numBlocks
      : parseInt(cacheConfig.associativity);
    const effectiveNumSets = isFullyAssociative ? 1 : numSets;

    const newCache = Array(effectiveNumSets)
      .fill()
      .map(() =>
        Array(effectiveAssociativity)
          .fill()
          .map(() => ({ valid: false, tag: -1, lastUsed: 0 }))
      );
    setCacheState(newCache);

    setStats({ hits: 0, misses: 0, accesses: 0 });
    setMemoryAccesses([]);
  }, [cacheConfig, numSets, numBlocks, isFullyAssociative]);

  const getSetAndTag = address => {
    const blockOffset = address & ((1 << blockOffsetBits) - 1);

    // For fully associative, all bits except the offset become the tag
    let setIndex, tag;
    if (isFullyAssociative) {
      setIndex = 0; // Only one set
      tag = address >> blockOffsetBits;
    } else {
      setIndex = (address >> blockOffsetBits) & ((1 << indexBits) - 1);
      tag = address >> (blockOffsetBits + indexBits);
    }

    return { setIndex, tag, blockOffset };
  };

  const accessMemory = address => {
    setCurrentAddress(address);
    const { setIndex, tag } = getSetAndTag(address);

    const newCacheState = [...cacheState];
    let hit = false;
    let wayAccessed = -1;

    // Check ways in this set for a hit
    const effectiveAssociativity = isFullyAssociative
      ? numBlocks
      : parseInt(cacheConfig.associativity);
    for (let i = 0; i < effectiveAssociativity; i++) {
      if (
        newCacheState[setIndex][i].valid &&
        newCacheState[setIndex][i].tag === tag
      ) {
        hit = true;
        wayAccessed = i;
        newCacheState[setIndex][i].lastUsed = stats.accesses + 1;
        break;
      }
    }

    if (!hit) {
      let wayToReplace = -1;
      // First look for an empty slot
      for (let i = 0; i < effectiveAssociativity; i++) {
        if (!newCacheState[setIndex][i].valid) {
          wayToReplace = i;
          break;
        }
      }

      // If no empty slots, use LRU to choose which to replace
      if (wayToReplace === -1) {
        let lruTime = Number.MAX_SAFE_INTEGER;
        for (let i = 0; i < effectiveAssociativity; i++) {
          if (newCacheState[setIndex][i].lastUsed < lruTime) {
            lruTime = newCacheState[setIndex][i].lastUsed;
            wayToReplace = i;
          }
        }
      }

      wayAccessed = wayToReplace;
      newCacheState[setIndex][wayToReplace] = {
        valid: true,
        tag: tag,
        lastUsed: stats.accesses + 1,
      };
    }

    setCacheState(newCacheState);

    setStats(prev => ({
      hits: prev.hits + (hit ? 1 : 0),
      misses: prev.misses + (hit ? 0 : 1),
      accesses: prev.accesses + 1,
    }));

    setMemoryAccesses(prev => [
      ...prev,
      {
        address,
        hit,
        setIndex,
        wayAccessed,
      },
    ]);
  };

  const generateAccessSequence = () => {
    const MAX_ADDR = 1024;
    let addresses = [];

    switch (accessPattern) {
      case 'sequential':
        addresses = Array.from({ length: 128 }, (_, i) => i * 4);
        break;

      case 'random':
        addresses = Array.from({ length: 100 }, () =>
          Math.floor(Math.random() * MAX_ADDR)
        );
        break;

      case 'strided':
        // More realistic stride based on a multiple of block size
        const stride = cacheConfig.blockSize * 8;
        addresses = Array.from(
          { length: 100 },
          (_, i) => (i * stride) % MAX_ADDR
        );
        break;

      case 'repeated':
        const baseAddrs = Array.from({ length: 8 }, () =>
          Math.floor(Math.random() * MAX_ADDR)
        );
        addresses = Array.from(
          { length: 100 },
          (_, i) => baseAddrs[i % baseAddrs.length]
        );
        break;

      default:
        addresses = [];
    }

    return addresses;
  };

  const runSimulation = () => {
    if (running) return;

    // Reset cache state
    const effectiveAssociativity = isFullyAssociative
      ? numBlocks
      : cacheConfig.associativity;
    const effectiveNumSets = isFullyAssociative ? 1 : numSets;

    setCacheState(
      Array(effectiveNumSets)
        .fill()
        .map(() =>
          Array(effectiveAssociativity)
            .fill()
            .map(() => ({ valid: false, tag: -1, lastUsed: 0 }))
        )
    );
    setStats({ hits: 0, misses: 0, accesses: 0 });
    setMemoryAccesses([]);
    setCurrentAddress(null);

    const addresses = generateAccessSequence();

    setRunning(true);

    let i = 0;
    // Store interval reference for cleanup
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (i < addresses.length) {
        accessMemory(addresses[i]);
        i++;
      } else {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setRunning(false);
      }
    }, 100);
  };

  // Get associativity options based on cache and block size
  const getAssociativityOptions = () => {
    const options = [
      { value: 1, label: 'Direct Mapped (1-way)' },
      { value: 2, label: '2-way' },
      { value: 4, label: '4-way' },
      { value: 8, label: '8-way' },
      // Special value for fully associative
      { value: 'fully', label: 'Fully Associative' },
    ];

    return options;
  };

  return (
    <div className='flex flex-col lg:flex-row p-4 gap-6'>
      {/* Main simulator column */}
      <div className='flex flex-col items-center max-w-full'>
        <h2 className='text-xl font-bold mb-4'>
          Cache Access Pattern Visualization
        </h2>

        <div className='flex flex-wrap gap-4 mb-4'>
          <div>
            <label className='block'>
              Cache Size: {cacheConfig.cacheSize} bytes
            </label>
            <select
              value={cacheConfig.cacheSize}
              onChange={e =>
                setCacheConfig({
                  ...cacheConfig,
                  cacheSize: parseInt(e.target.value),
                  // Reset associativity if it's now invalid
                  associativity:
                    parseInt(e.target.value) / cacheConfig.blockSize <
                    cacheConfig.associativity
                      ? 4
                      : cacheConfig.associativity,
                })
              }
              className='border rounded p-1'
              disabled={running}
            >
              <option value='128'>128B</option>
              <option value='256'>256B</option>
              <option value='512'>512B</option>
            </select>
          </div>

          <div>
            <label className='block'>
              Block Size: {cacheConfig.blockSize} bytes
            </label>
            <select
              value={cacheConfig.blockSize}
              onChange={e =>
                setCacheConfig({
                  ...cacheConfig,
                  blockSize: parseInt(e.target.value),
                  // Reset associativity if it's now invalid
                  associativity:
                    cacheConfig.cacheSize / parseInt(e.target.value) <
                    cacheConfig.associativity
                      ? 4
                      : cacheConfig.associativity,
                })
              }
              className='border rounded p-1'
              disabled={running}
            >
              <option value='16'>16B</option>
              <option value='32'>32B</option>
              <option value='64'>64B</option>
            </select>
          </div>

          <div>
            <label className='block'>Associativity:</label>
            <select
              value={cacheConfig.associativity}
              onChange={e => {
                const value =
                  e.target.value === 'fully'
                    ? 'fully'
                    : parseInt(e.target.value);
                setCacheConfig({
                  ...cacheConfig,
                  associativity: value,
                });
              }}
              className='border rounded p-1'
              disabled={running}
            >
              {getAssociativityOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block'>Access Pattern:</label>
            <select
              value={accessPattern}
              onChange={e => setAccessPattern(e.target.value)}
              className='border rounded p-1'
              disabled={running}
            >
              <option value='sequential'>Sequential</option>
              <option value='random'>Random</option>
              <option value='strided'>Strided</option>
              <option value='repeated'>Repeated</option>
            </select>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={running}
          className='bg-blue-500 text-white py-2 px-4 rounded mb-4'
        >
          {running ? 'Running...' : 'Run Simulation'}
        </button>

        <div className='mb-4 p-2 border rounded w-full max-w-md'>
          <h3 className='font-bold'>Statistics:</h3>
          <p>Accesses: {stats.accesses}</p>
          <p>Hits: {stats.hits}</p>
          <p>Misses: {stats.misses}</p>
          <p>
            Hit Rate:{' '}
            {stats.accesses > 0
              ? ((stats.hits / stats.accesses) * 100).toFixed(2) + '%'
              : '0%'}
          </p>
          <p>
            Current Address:{' '}
            {currentAddress !== null
              ? '0x' + currentAddress.toString(16).padStart(8, '0')
              : 'None'}
          </p>
        </div>

        <div className='mb-4 overflow-x-auto w-full'>
          <h3 className='font-bold'>Cache State:</h3>
          <div className='flex'>
            <div
              className='font-bold pr-2 text-center'
              style={{ minWidth: '60px' }}
            >
              Set
            </div>
            {cacheState.length > 0 &&
              cacheState[0].map((_, wayIdx) => (
                <div
                  key={wayIdx}
                  className='font-bold px-2 text-center'
                  style={{ minWidth: '100px' }}
                >
                  Way {wayIdx}
                </div>
              ))}
          </div>

          {cacheState.map((set, setIdx) => (
            <div key={setIdx} className='flex border-t'>
              <div className='pr-2 text-center' style={{ minWidth: '60px' }}>
                {setIdx}
              </div>
              {set.map((way, wayIdx) => (
                <div
                  key={wayIdx}
                  className={`px-2 border-l text-center ${
                    currentAddress !== null &&
                    getSetAndTag(currentAddress).setIndex === setIdx &&
                    memoryAccesses.length > 0 &&
                    memoryAccesses[memoryAccesses.length - 1].wayAccessed ===
                      wayIdx
                      ? 'bg-yellow-200'
                      : ''
                  }`}
                  style={{ minWidth: '100px' }}
                >
                  {way.valid ? (
                    <span>Tag: 0x{way.tag.toString(16)}</span>
                  ) : (
                    <span className='text-gray-400'>Invalid</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className='w-full max-h-40 overflow-y-auto border rounded p-2'>
          <h3 className='font-bold'>Recent Accesses:</h3>
          <div className='flex flex-col-reverse'>
            {memoryAccesses
              .slice(-20)
              .reverse()
              .map((access, idx) => (
                <div
                  key={idx}
                  className={`${
                    access.hit ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  Address: 0x{access.address.toString(16).padStart(8, '0')} →
                  Set: {access.setIndex},{access.hit ? ' HIT' : ' MISS'}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Explanation column */}
      <div className='flex-shrink-0 w-full lg:w-80'>
        <ExplanationPanel />
      </div>
    </div>
  );
};

export default CacheVisualizer;
