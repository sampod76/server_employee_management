// import { ConnectionOptions } from 'bullmq';
// import { Cluster } from 'ioredis';
// import config from '../../config';

// class RedisCluster {
//   private redisClusterClient: Cluster;
//   private pubRedis: Cluster;
//   private subRedis: Cluster;
//   private redisConnectionString: ConnectionOptions;

//   constructor() {
//     // Define the Redis Cluster nodes
//     const redisNodes = [
//       { host: config.redis.host1, port: Number(config.redis.host1_port) },
//       { host: config.redis.host2, port: Number(config.redis.host2_port) },
//       { host: config.redis.host3, port: Number(config.redis.host3_port) },
//     ];
//     // Initialize the Redis Cluster client for general use
//     this.redisClusterClient = new Cluster(redisNodes, {
//       clusterRetryStrategy: times => Math.min(times * 100, 3000), // Retry strategy
//       redisOptions: {
//         connectTimeout: 10000, // Adjust timeout as needed
//       },
//     });

//     // Initialize separate cluster connections for Pub/Sub
//     this.pubRedis = new Cluster(redisNodes);
//     this.subRedis = new Cluster(redisNodes);

//     // Define the connection options for BullMQ (can use any node)
//     this.redisConnectionString = {
//       host: config.redis.host1,
//       port: Number(config.redis.host1),
//       // Optional: Include username/password if authentication is required
//       // username: config.redis.userName,
//       // password: config.redis.password,
//     };
//   }

//   // Method to get the Redis Cluster client instance
//   public getredisClient: Cluster {
//     return this.redisClusterClient;
//   }

//   // Method to get the publisher Redis instance
//   public getPubRedis(): Cluster {
//     return this.pubRedis;
//   }

//   // Method to get the subscriber Redis instance
//   public getSubRedis(): Cluster {
//     return this.subRedis;
//   }

//   // Method to get the connection options for BullMQ
//   public getRedisConnectionString(): ConnectionOptions {
//     return this.redisClusterClient;
//   }

//   // Method to close all Redis connections
//   public async closeConnections() {
//     await this.redisClusterClient.quit();
//     await this.pubRedis.quit();
//     await this.subRedis.quit();
//   }
// }

// // Export the instance of RedisCluster
// export const redisCluster = new RedisCluster();
