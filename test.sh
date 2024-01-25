#!/bin/bash

# Store the output of 'forever list' to a variable
foreverList="info:    Forever processes running
data:        uid  command       script              forever pid   id logfile                 uptime                   
data:    [0] RX4N /usr/bin/node simpleProducerCG.js 31347   31361    /root/.forever/RX4N.log 0:0:3:53.376000000000005 
data:    [1] 4GtQ /usr/bin/node producerMYSQL.js    31397   31410    /root/.forever/4GtQ.log 0:0:3:52.673             
data:    [2] 0Nb6 /usr/bin/node consumerMYSQL.js    31685   31698    /root/.forever/0Nb6.log 0:0:0:41.246"

# Use awk to extract PIDs from the 'forever list' output
# Assumes that PIDs are in the second column of the output
pids=$(echo "$foreverList" | awk 'NR>2 {print $6}')

# Loop through each PID and stop the corresponding process
for pid in $pids
do
    echo "$pid"
done



























#!/bin/bash

# Store the output of 'forever list' to a variable
foreverList=$(forever list)

# Use awk to extract PIDs from the 'forever list' output
# Assumes that PIDs are in the second column of the output
pids=$(echo "$foreverList" | awk 'NR>2 {print $6}')

# Loop through each PID and stop the corresponding process
for pid in $pids
do
    forever stop "$pid"
done

# Log the restart timestamp
timestamp=$(date '+%Y-%m-%d %H:%M:%S')
echo "restart at $timestamp" >> /root/workspace/restartLogs.txt

sleep 2

cd /root/workspace/kafka_carte_grise
forever start simpleProducerCG.js

cd /root/workspace/kafka_titres-main
forever start consumerMYSQL.js

cd /root/workspace/kafka_titres-main
forever start producerMYSQL.js
