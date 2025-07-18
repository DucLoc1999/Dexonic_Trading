// Test script để kiểm tra logic best quote selection
const testQuotes = [
  {
    dex: 'Liquidswap',
    outputAmount: '0.190447',
    fee: '0.17',
    priceImpact: '0.16',
    route: ['Liquidswap']
  },
  {
    dex: 'Aggregator',
    outputAmount: '0.189456',
    fee: '0.25',
    priceImpact: '0.60',
    route: ['Aggregator']
  },
  {
    dex: 'Thala',
    outputAmount: '0.190314',
    fee: '0.14',
    priceImpact: '0.26',
    route: ['Thala']
  },
  {
    dex: 'Aux',
    outputAmount: '0.190104',
    fee: '0.29',
    priceImpact: '0.22',
    route: ['Aux']
  }
];

// Logic best quote selection
const validQuotes = testQuotes.filter(quote => {
  const output = parseFloat(quote.outputAmount);
  return !isNaN(output) && output > 0;
});

console.log('Valid quotes:', validQuotes.map(q => ({ dex: q.dex, output: q.outputAmount })));

if (validQuotes.length > 0) {
  let bestQuote = validQuotes[0];
  for (const quote of validQuotes) {
    if (parseFloat(quote.outputAmount) > parseFloat(bestQuote.outputAmount)) {
      bestQuote = quote;
    }
  }
  
  console.log('🏆 Best quote:', bestQuote.dex, 'with output:', bestQuote.outputAmount);
  
  // Verify
  const maxOutput = Math.max(...validQuotes.map(q => parseFloat(q.outputAmount)));
  console.log('📊 Max output:', maxOutput);
  console.log('✅ Correct:', parseFloat(bestQuote.outputAmount) === maxOutput);
} else {
  console.log('⚠️ No valid quotes found');
} 