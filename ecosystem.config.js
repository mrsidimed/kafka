// ecosystem.config.js
module.exports = {
    apps: [
      // 1) consumerMYSQL
      {
        name: "consumer-mysql",
     
        cwd: "/Users/sidimed/workspace/kafka/kafka_passeport-main",        // folder that contains consumerMYSQL.js and its ./logs
        script: "consumerMYSQL.js",
        exec_mode: "fork",
        instances: 1,
        watch: false,
  
        // Auto-restart on any exit/crash (PM2 default, but set explicitly)
        autorestart: true,
        min_uptime: "10s",                   // consider "up" only after 10s
        exp_backoff_restart_delay: 2000,     // backoff on repeated crashes
        restart_delay: 5000,                 // delay between restarts
  
        // Daily restart at 04:00 (Nouakchott)
        cron_restart: "0 4 * * *",
        cron_restart_tz: "Africa/Nouakchott",
  
        max_memory_restart: "500M",
        out_file: "./logs-pm2/consumer-mysql.out.txt",
        error_file: "./logs-pm2/consumer-mysql.err.txt",
        time: true,
        env: { NODE_ENV: "development" },
        env_production: { NODE_ENV: "production" }
      },
  
      // 2) producerMYSQL
      {
        name: "producer-mysql",
        cwd: "/Users/sidimed/workspace/kafka/kafka_passeport-main",        // folder that contains consumerMYSQL.js and its ./logs
        script: "producerMYSQL.js",
        exec_mode: "fork",
        instances: 1,
        watch: false,
  
        autorestart: true,
        min_uptime: "10s",
        exp_backoff_restart_delay: 2000,
        restart_delay: 5000,
  
        cron_restart: "0 4 * * *",
        cron_restart_tz: "Africa/Nouakchott",
  
        max_memory_restart: "500M",
        out_file: "./logs-pm2/producer-mysql.txt",
        error_file: "./logs-pm2/producer-mysql.txt",
        time: true,
        env: { NODE_ENV: "development" },
        env_production: { NODE_ENV: "production" }
      },
  
      // 3) serverOrderPublisherToTresor
      {
        name: "server-order-publisher-to-tresor",


        cwd: "/Users/sidimed/workspace/kafka/kafka_carte_grise-main",        // folder that contains consumerMYSQL.js and its ./logs
      
        script: "serverOrderPublisherToTresor.js",

        

        exec_mode: "fork",   // switch to "cluster" + instances:"max" if it's an HTTP server
        instances: 1,
        watch: false,
  
        autorestart: true,
        min_uptime: "10s",
        exp_backoff_restart_delay: 2000,
        restart_delay: 5000,
  
        cron_restart: "0 4 * * *",
        cron_restart_tz: "Africa/Nouakchott",
  
        max_memory_restart: "500M",
        out_file: "./logs-pm2/server-order.out.txt",
        error_file: "./logs-pm2/server-order.err.txt",
        time: true,
        env: { NODE_ENV: "development" },
        env_production: { NODE_ENV: "production" }
      },
  
      // 4) serverRecettePublisherToEndpoint
      {
        name: "server-recette-publisher-to-endpoint",
        cwd: "/Users/sidimed/workspace/kafka/kafka_carte_grise-main",
        script: "serverRecettePublisherToEndpoint.js",
        exec_mode: "fork",
        instances: 1,
        watch: false,
  
        autorestart: true,
        min_uptime: "10s",
        exp_backoff_restart_delay: 2000,
        restart_delay: 5000,
  
        cron_restart: "0 4 * * *",
        cron_restart_tz: "Africa/Nouakchott",
  
        max_memory_restart: "500M",
        out_file: "./logs-pm2/server-recette.out.txt",
        error_file: "./logs-pm2/server-recette.err.txt",
        time: true,
        env: { NODE_ENV: "development" },
        env_production: { NODE_ENV: "production" }
      }
    ]
  };
  