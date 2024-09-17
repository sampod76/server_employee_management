import { redisClient } from './redis';

export async function deleteAllKeys(pattern: string) {
  let cursor = '0';
  const count = 200; // Reasonable count to balance performance
  let totalDeleted = 0;

  do {
    // Use the SCAN command to find keys
    const [newCursor, foundKeys] = await redisClient.scan(
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      count,
    );
    cursor = newCursor;

    if (foundKeys.length > 0) {
      // Delete the keys
      await redisClient.del(...foundKeys);
      totalDeleted += foundKeys.length;
      console.log(
        `Deleted ${foundKeys} keys, total deleted: ${totalDeleted}`.bgRed,
      );
    }
  } while (cursor !== '0');

  console.log(
    `All keys matching the pattern '${pattern}' have been deleted. Total keys deleted: ${totalDeleted}`
      .bgGreen,
  );
}
