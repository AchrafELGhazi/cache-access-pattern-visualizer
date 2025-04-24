export const ExplanationPanel = () => {
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
              <b>Direct Mapped</b>: Each memory location maps to one specific
              spot
            </li>
            <li>
              <b>Set-Associative</b>: Each location maps to one set but can go
              in any way in that set
            </li>
            <li>
              <b>Fully Associative</b>: Data can go anywhere in the cache
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
