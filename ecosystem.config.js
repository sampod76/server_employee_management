// module.exports = {
//   apps: [
//     {
//       name: 'dr_marzen',
//       script: './dist/server.js',
//       env: {
//         NODE_ENV: 'development',
//       },
//       env_production: {
//         NODE_ENV: 'production',
//       },
//     },
//     // {
//     //   name: 'worker',
//     //   script: 'worker.js',
//     // },
//   ],
// };
module.exports = {
  apps: [
    {
      name: 'ems_server',
      script: './dist/server.js',
      watch: ['src'],
      ignore_watch: ['node_modules', 'logs'],
      watch_options: {
        followSymlinks: false,
      },
      instances: '1', // you can use count of replica you application , 2 or 3 , but you can use max then count max cpu
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        TS_NODE_PROJECT: 'tsconfig.json',
        //   PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        TS_NODE_PROJECT: 'tsconfig.build.json',
        //   PORT: 8080
      },
      autorestart: true,
      restart_delay: 5000,
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      source_map_support: true,
      'pre-start': 'yarn run build',
    },
  ],
};
