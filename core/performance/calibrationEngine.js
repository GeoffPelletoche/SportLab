export function buildCalibration(records = []) {
  const buckets = Array.from({ length: 10 }, (_, index) => ({ min: index * 10, max: index * 10 + 9, count: 0, predicted: 0, actual: 0 }));
  records.forEach(record => { const probability = Number(record.probability); if (!Number.isFinite(probability)) return; const bucket = buckets[Math.min(9, Math.max(0, Math.floor(probability / 10)))]; bucket.count += 1; bucket.predicted += probability; bucket.actual += record.won === true ? 100 : 0; });
  return buckets.map(bucket => ({ ...bucket, predicted: bucket.count ? bucket.predicted / bucket.count : 0, actual: bucket.count ? bucket.actual / bucket.count : 0 }));
}
